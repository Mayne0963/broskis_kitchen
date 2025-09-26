import Stripe from 'stripe';
import { adminDb, auth, Timestamp } from '@/lib/firebaseAdmin';
import { logError, logInfo, logDebug } from '@/lib/log';
import { Order, OrderItem, OrderStatus } from '@/types/order';
import { getLoyaltyProfile, shouldApplyVolunteerDiscount, calculateVolunteerDiscount } from '@/lib/rewards';

interface StripeEventData {
  processedAt: FirebaseFirestore.Timestamp;
  orderId: string;
}

interface OrderData extends Omit<Order, 'id'> {
  id: string;
}

/**
 * Generates a unique order ID with timestamp and random suffix
 */
function generateOrderId(): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `order_${timestamp}_${randomSuffix}`;
}

/**
 * Links order to Firebase user by email lookup
 */
async function linkUserByEmail(email: string): Promise<{ uid: string; displayName?: string } | null> {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return {
      uid: userRecord.uid,
      displayName: userRecord.displayName || undefined,
    };
  } catch (error) {
    logDebug('User not found in Firebase Auth', { email });
    return null;
  }
}

/**
 * Processes checkout session completed event
 */
async function processCheckoutSession(session: Stripe.Checkout.Session, eventId: string, stripe: Stripe): Promise<OrderData> {
  logDebug('Processing checkout session', { sessionId: session.id });

  // Fetch line items from Stripe
  const lineItemsResponse = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ['data.price.product'],
  });

  const items: OrderItem[] = lineItemsResponse.data.map((item) => {
    const product = item.price?.product as Stripe.Product;
    return {
      name: product?.name || item.description || 'Unknown Item',
      quantity: item.quantity || 1,
      priceCents: Math.round((item.amount_total || 0) / (item.quantity || 1)),
    };
  });

  // Calculate totals from Stripe data
  const totalCents = session.amount_total || 0;
  const taxCents = session.total_details?.amount_tax || 0;
  const subtotalCents = totalCents - taxCents;

  // Extract customer email
  const customerEmail = session.customer_details?.email || session.customer_email;
  if (!customerEmail) {
    throw new Error('No customer email found in checkout session');
  }

  // Link to Firebase user
  const userInfo = await linkUserByEmail(customerEmail);

  // Check for volunteer discount eligibility
  let volunteerDiscountCents = 0;
  let hasVolunteerDiscount = false;
  
  if (userInfo?.uid) {
    try {
      const loyaltyProfile = await getLoyaltyProfile(userInfo.uid);
      if (loyaltyProfile) {
        const orderSubtotalDollars = subtotalCents / 100;
        const hasOtherDiscounts = false; // TODO: Check for other applied discounts
        
        if (shouldApplyVolunteerDiscount(loyaltyProfile.tier, orderSubtotalDollars, hasOtherDiscounts)) {
          const discountDollars = calculateVolunteerDiscount(orderSubtotalDollars);
          volunteerDiscountCents = Math.round(discountDollars * 100);
          hasVolunteerDiscount = true;
        }
      }
    } catch (error) {
      logError('Error checking volunteer discount eligibility', { error, userId: userInfo.uid });
    }
  }

  // Apply volunteer discount to total if applicable
  const finalTotalCents = totalCents - volunteerDiscountCents;

  // Determine if this is a test order
  const isTest = !session.livemode;

  const orderId = generateOrderId();
  const now = Timestamp.now();

  const order: OrderData = {
    id: orderId,
    createdAt: now,
    updatedAt: now,
    status: 'paid' as OrderStatus,
    userId: userInfo?.uid || null,
    userEmail: customerEmail,
    userName: userInfo?.displayName || session.customer_details?.name || null,
    items,
    subtotalCents,
    taxCents,
    totalCents: finalTotalCents,
    currency: session.currency || 'usd',
    isTest,
    stripePaymentIntentId: session.payment_intent as string,
    stripeSessionId: session.id,
    stripeCustomerId: session.customer as string,
    // Volunteer discount information
    volunteerDiscountCents: hasVolunteerDiscount ? volunteerDiscountCents : undefined,
    hasVolunteerDiscount,
    address: session.customer_details?.address ? {
      line1: session.customer_details.address.line1 || '',
      line2: session.customer_details.address.line2 || null,
      city: session.customer_details.address.city || '',
      state: session.customer_details.address.state || '',
      postalCode: session.customer_details.address.postal_code || '',
      country: session.customer_details.address.country || '',
    } : null,
    metadata: {
      stripeEventId: eventId,
      stripeSessionId: session.id,
      stripeLiveMode: session.livemode,
    },
  };

  return order;
}

/**
 * Processes payment intent succeeded event
 */
async function processPaymentIntent(paymentIntent: Stripe.PaymentIntent, eventId: string): Promise<OrderData> {
  logDebug('Processing payment intent', { paymentIntentId: paymentIntent.id });

  // Extract customer email
  const customerEmail = paymentIntent.receipt_email;
  if (!customerEmail) {
    throw new Error('No customer email found in payment intent');
  }

  // Link to Firebase user
  const userInfo = await linkUserByEmail(customerEmail);

  // For payment intents, we need to create a basic order structure
  // since we don't have detailed line items
  const items: OrderItem[] = [{
    name: paymentIntent.description || 'Payment',
    quantity: 1,
    priceCents: paymentIntent.amount,
  }];

  const totalCents = paymentIntent.amount;
  const taxCents = 0; // Not available in payment intent
  const subtotalCents = totalCents;

  // Determine if this is a test order
  const isTest = !paymentIntent.livemode;

  const orderId = generateOrderId();
  const now = Timestamp.now();

  const order: OrderData = {
    id: orderId,
    createdAt: now,
    updatedAt: now,
    status: 'paid' as OrderStatus,
    userId: userInfo?.uid || null,
    userEmail: customerEmail,
    userName: userInfo?.displayName || null,
    items,
    subtotalCents,
    taxCents,
    totalCents,
    currency: paymentIntent.currency,
    isTest,
    stripePaymentIntentId: paymentIntent.id,
    stripeSessionId: null,
    stripeCustomerId: paymentIntent.customer as string,
    address: null, // Not available in payment intent
    metadata: {
      stripeEventId: eventId,
      stripePaymentIntentId: paymentIntent.id,
      stripeLiveMode: paymentIntent.livemode,
    },
  };

  return order;
}

/**
 * Persists order to Firestore with transaction safety
 */
async function persistOrder(order: OrderData, eventId: string): Promise<void> {
  await adminDb.runTransaction(async (transaction) => {
    // Check if event was already processed (idempotency)
    const eventRef = adminDb.collection('stripeEvents').doc(eventId);
    const eventDoc = await transaction.get(eventRef);
    
    if (eventDoc.exists) {
      logInfo('Event already processed, skipping', { eventId, orderId: eventDoc.data()?.orderId });
      return;
    }

    // Write to global orders collection
    const orderRef = adminDb.collection('orders').doc(order.id);
    transaction.set(orderRef, order);

    // Write to user subcollection if user is linked
    if (order.userId) {
      const userOrderRef = adminDb
        .collection('users')
        .doc(order.userId)
        .collection('orders')
        .doc(order.id);
      transaction.set(userOrderRef, order);
    }

    // Mark event as processed
    const eventData: StripeEventData = {
      processedAt: Timestamp.now(),
      orderId: order.id,
    };
    transaction.set(eventRef, eventData);

    logInfo('Order persisted successfully', {
      orderId: order.id,
      userId: order.userId,
      totalCents: order.totalCents,
      eventId,
    });
  });
}

/**
 * Main function to upsert order from Stripe event
 * Handles both checkout.session.completed and payment_intent.succeeded events
 */
export async function upsertOrderFromStripe(
  event: Stripe.Event,
  stripe: Stripe
): Promise<{ orderId: string; message: string }> {
  // Check if event was already processed (early idempotency check)
  const existingEvent = await adminDb.collection('stripeEvents').doc(event.id).get();
  if (existingEvent.exists) {
    logInfo('Event already processed (early check)', {
      eventId: event.id,
      orderId: existingEvent.data()?.orderId,
    });
    return {
      orderId: existingEvent.data()?.orderId,
      message: 'Event already processed',
    };
  }

  let order: OrderData;

  // Process different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      order = await processCheckoutSession(session, event.id, stripe);
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      order = await processPaymentIntent(paymentIntent, event.id);
      break;
    }

    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }

  // Persist order with transaction safety
  await persistOrder(order, event.id);

  return {
    orderId: order.id,
    message: 'Order created successfully',
  };
}