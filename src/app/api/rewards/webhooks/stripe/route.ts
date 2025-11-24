import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { 
  calculatePointsFromAmount, 
  getLoyaltyProfile, 
  createLoyaltyProfile, 
  updateLoyaltyProfile,
  createPointsTransaction
} from '@/lib/rewards';
import { db } from '@/lib/firebase/admin';
import { runTransaction } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    // Get customer and metadata
    const customerId = session.customer as string;
    const userId = session.metadata?.userId;
    
    if (!userId) {
      console.error('No userId in session metadata');
      return;
    }
    
    // Get line items to calculate points (excluding tax, tips, delivery)
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    });
    
    // Calculate eligible amount (excluding tax, tips, delivery fees)
    let eligibleAmount = 0;
    
    for (const item of lineItems.data) {
      const product = item.price?.product as Stripe.Product;
      const productName = product?.name?.toLowerCase() || '';
      
      // Skip tax, tips, delivery fees, alcohol, gift cards
      if (
        productName.includes('tax') ||
        productName.includes('tip') ||
        productName.includes('delivery') ||
        productName.includes('alcohol') ||
        productName.includes('gift card') ||
        productName.includes('beer') ||
        productName.includes('wine') ||
        productName.includes('liquor')
      ) {
        continue;
      }
      
      eligibleAmount += (item.amount_total || 0);
    }
    
    // Convert from cents to dollars
    eligibleAmount = eligibleAmount / 100;
    
    if (eligibleAmount <= 0) {
      console.log('No eligible amount for points accrual');
      return;
    }
    
    // Calculate points (1 point per $0.10 spent)
    const pointsEarned = calculatePointsFromAmount(eligibleAmount);
    
    if (pointsEarned <= 0) {
      console.log('No points earned for this order');
      return;
    }
    
    // Process points accrual in transaction
    await runTransaction(db, async (transaction) => {
      // Get or create loyalty profile
      let loyaltyProfile = await getLoyaltyProfile(userId);
      
      if (!loyaltyProfile) {
        // Create new loyalty profile
        const newProfile = {
          userId,
          currentPoints: pointsEarned,
          pendingPoints: 0,
          totalEarned: pointsEarned,
          totalRedeemed: 0,
          tier: 'regular' as const,
          canSpin: true,
          lastSpinDate: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const loyaltyRef = db.collection('loyalty').doc(userId);
        transaction.set(loyaltyRef, newProfile);
        loyaltyProfile = newProfile;
      } else {
        // Update existing profile
        const loyaltyRef = db.collection('loyalty').doc(userId);
        transaction.update(loyaltyRef, {
          currentPoints: loyaltyProfile.currentPoints + pointsEarned,
          totalEarned: loyaltyProfile.totalEarned + pointsEarned,
          updatedAt: new Date()
        });
      }
      
      // Create points transaction record
      const pointsTransactionRef = db.collection('pointsTransactions').doc();
      const pointsTransactionData = {
        id: pointsTransactionRef.id,
        userId,
        type: 'purchase' as const,
        points: pointsEarned,
        description: `Purchase points earned`,
        metadata: {
          stripeSessionId: session.id,
          orderAmount: eligibleAmount,
          pointsRate: '1 point per $0.10'
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      };
      
      transaction.set(pointsTransactionRef, pointsTransactionData);
    });
    
    console.log(`Awarded ${pointsEarned} points to user ${userId} for order ${session.id}`);
    
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Similar logic to checkout session, but for direct payment intents
    const userId = paymentIntent.metadata?.userId;
    
    if (!userId) {
      console.error('No userId in payment intent metadata');
      return;
    }
    
    // For payment intents, we'll use the amount directly
    // In a real implementation, you might want to fetch the order details
    // to exclude tax, tips, etc.
    const eligibleAmount = paymentIntent.amount / 100; // Convert from cents
    
    if (eligibleAmount <= 0) {
      console.log('No eligible amount for points accrual');
      return;
    }
    
    const pointsEarned = calculatePointsFromAmount(eligibleAmount);
    
    if (pointsEarned <= 0) {
      console.log('No points earned for this payment');
      return;
    }
    
    // Process points accrual (similar to checkout session)
    await runTransaction(db, async (transaction) => {
      let loyaltyProfile = await getLoyaltyProfile(userId);
      
      if (!loyaltyProfile) {
        const newProfile = {
          userId,
          currentPoints: pointsEarned,
          pendingPoints: 0,
          totalEarned: pointsEarned,
          totalRedeemed: 0,
          tier: 'regular' as const,
          canSpin: true,
          lastSpinDate: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const loyaltyRef = db.collection('loyalty').doc(userId);
        transaction.set(loyaltyRef, newProfile);
        loyaltyProfile = newProfile;
      } else {
        const loyaltyRef = db.collection('loyalty').doc(userId);
        transaction.update(loyaltyRef, {
          currentPoints: loyaltyProfile.currentPoints + pointsEarned,
          totalEarned: loyaltyProfile.totalEarned + pointsEarned,
          updatedAt: new Date()
        });
      }
      
      const pointsTransactionRef = db.collection('pointsTransactions').doc();
      const pointsTransactionData = {
        id: pointsTransactionRef.id,
        userId,
        type: 'purchase' as const,
        points: pointsEarned,
        description: `Payment points earned`,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          orderAmount: eligibleAmount,
          pointsRate: '1 point per $0.10'
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      };
      
      transaction.set(pointsTransactionRef, pointsTransactionData);
    });
    
    console.log(`Awarded ${pointsEarned} points to user ${userId} for payment ${paymentIntent.id}`);
    
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}
