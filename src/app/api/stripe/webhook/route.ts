import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, auth, Timestamp } from '@/lib/firebaseAdmin';
import { logError, logInfo, logDebug } from '@/lib/log';
import { Order, OrderItem, OrderStatus } from '@/types/order';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
async function processCheckoutSession(session: Stripe.Checkout.Session, eventId: string): Promise<OrderData> {
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
    totalCents,
    currency: session.currency || 'usd',
    isTest,
    stripePaymentIntentId: session.payment_intent as string,
    stripeSessionId: session.id,
    stripeCustomerId: session.customer as string,
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

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret is configured
    if (!webhookSecret) {
      await logError('Webhook secret not configured', {
        source: 'stripe-webhook',
      });
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      await logError('Missing Stripe signature', {
        source: 'stripe-webhook',
      });
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      await logError(err as Error, {
        source: 'stripe-webhook',
        metadata: { signature: signature.substring(0, 20) + '...' },
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    logInfo('Received Stripe webhook', {
      eventId: event.id,
      eventType: event.type,
      liveMode: event.livemode,
    });

    // Check if event was already processed (early idempotency check)
    const existingEvent = await adminDb.collection('stripeEvents').doc(event.id).get();
    if (existingEvent.exists) {
      logInfo('Event already processed (early check)', {
        eventId: event.id,
        orderId: existingEvent.data()?.orderId,
      });
      return NextResponse.json({
        ok: true,
        orderId: existingEvent.data()?.orderId,
        message: 'Event already processed',
      });
    }

    let order: OrderData;

    // Process different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        order = await processCheckoutSession(session, event.id);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        order = await processPaymentIntent(paymentIntent, event.id);
        break;
      }

      default:
        logInfo('Unhandled event type', { eventType: event.type, eventId: event.id });
        return NextResponse.json({ ok: true, message: 'Event type not handled' });
    }

    // Persist order with transaction safety
    await persistOrder(order, event.id);

    // Trigger revalidation of admin dashboard
    // Note: In a real app, you might want to use revalidatePath here
    // For now, we rely on the admin dashboard's real-time queries

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      message: 'Order created successfully',
    });

  } catch (error) {
    await logError(error as Error, {
      source: 'stripe-webhook',
      metadata: {
        url: request.url,
        method: request.method,
      },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}