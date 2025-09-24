import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../../../../lib/firebase-admin';
import { LoyaltyProfile, PointsTransaction } from '../../../../types/rewards';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Disable body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

interface StripeWebhookResponse {
  received: boolean;
  message?: string;
  error?: string;
}

// Points earning rules
const POINTS_PER_DOLLAR = 10; // Base rate: 10 points per $1 spent
const TIER_MULTIPLIERS = {
  bronze: 1.0,
  silver: 1.2,
  gold: 1.5,
  platinum: 2.0
};

// Minimum order amount to earn points (in cents)
const MIN_ORDER_AMOUNT = 500; // $5.00

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StripeWebhookResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ received: false, error: 'Method not allowed' });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });

    // Get the webhook signature
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(500).json({ received: false, error: 'Webhook secret not configured' });
    }

    // Get the raw body
    const buf = await buffer(req);
    let event: Stripe.Event;

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ received: false, error: 'Invalid signature' });
    }

    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();

    console.log('Received Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Extract customer information
        const customerId = paymentIntent.customer as string;
        const amount = paymentIntent.amount; // Amount in cents
        const currency = paymentIntent.currency;
        const orderId = paymentIntent.metadata?.orderId;
        
        console.log('Processing payment_intent.succeeded:', {
          paymentIntentId: paymentIntent.id,
          customerId,
          amount,
          currency,
          orderId
        });

        // Skip if amount is below minimum
        if (amount < MIN_ORDER_AMOUNT) {
          console.log('Order amount below minimum for points earning:', amount);
          return res.status(200).json({ received: true, message: 'Order below minimum amount' });
        }

        // Skip if not USD (for simplicity)
        if (currency !== 'usd') {
          console.log('Non-USD currency, skipping points award:', currency);
          return res.status(200).json({ received: true, message: 'Non-USD currency' });
        }

        // Get customer details from Stripe
        let customer: Stripe.Customer | null = null;
        if (customerId) {
          try {
            customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          } catch (error) {
            console.error('Error retrieving customer:', error);
          }
        }

        // Extract user ID from customer metadata or email
        let userId: string | null = null;
        if (customer && !customer.deleted) {
          userId = customer.metadata?.userId || null;
          
          // If no userId in metadata, try to find user by email
          if (!userId && customer.email) {
            try {
              // Query loyalty profiles by email (assuming email is stored)
              const loyaltyQuery = await db.collection('loyalty')
                .where('email', '==', customer.email)
                .limit(1)
                .get();
              
              if (!loyaltyQuery.empty) {
                userId = loyaltyQuery.docs[0].id;
              }
            } catch (error) {
              console.error('Error finding user by email:', error);
            }
          }
        }

        if (!userId) {
          console.log('No user ID found for customer, skipping points award');
          return res.status(200).json({ received: true, message: 'No user ID found' });
        }

        // Get or create loyalty profile
        const loyaltyRef = db.collection('loyalty').doc(userId);
        const loyaltyDoc = await loyaltyRef.get();
        
        let loyaltyProfile: LoyaltyProfile;
        if (!loyaltyDoc.exists) {
          // Create new loyalty profile
          loyaltyProfile = {
            userId,
            email: customer?.email || '',
            currentPoints: 0,
            totalPointsEarned: 0,
            tier: 'bronze',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivity: new Date(),
            banned: false
          };
          await loyaltyRef.set(loyaltyProfile);
        } else {
          loyaltyProfile = loyaltyDoc.data() as LoyaltyProfile;
        }

        // Calculate points to award
        const dollarAmount = amount / 100; // Convert cents to dollars
        const basePoints = Math.floor(dollarAmount * POINTS_PER_DOLLAR);
        const tierMultiplier = TIER_MULTIPLIERS[loyaltyProfile.tier];
        const pointsToAward = Math.floor(basePoints * tierMultiplier);

        // Create transaction record
        const transactionId = `stripe_${paymentIntent.id}_${Date.now()}`;
        const transaction: PointsTransaction = {
          id: transactionId,
          userId,
          type: 'earned',
          points: pointsToAward,
          description: `Purchase reward: $${dollarAmount.toFixed(2)} order${orderId ? ` (#${orderId})` : ''}`,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year expiry
          metadata: {
            source: 'stripe_webhook',
            paymentIntentId: paymentIntent.id,
            customerId,
            orderAmount: amount,
            currency,
            orderId,
            basePoints,
            tierMultiplier,
            userTier: loyaltyProfile.tier
          }
        };

        // Update loyalty profile and create transaction
        const newCurrentPoints = loyaltyProfile.currentPoints + pointsToAward;
        const newTotalPointsEarned = loyaltyProfile.totalPointsEarned + pointsToAward;
        
        // Check for tier upgrade
        let newTier = loyaltyProfile.tier;
        if (newTotalPointsEarned >= 10000 && loyaltyProfile.tier !== 'platinum') {
          newTier = 'platinum';
        } else if (newTotalPointsEarned >= 5000 && loyaltyProfile.tier === 'bronze' || loyaltyProfile.tier === 'silver') {
          newTier = 'gold';
        } else if (newTotalPointsEarned >= 1000 && loyaltyProfile.tier === 'bronze') {
          newTier = 'silver';
        }

        const updatedLoyaltyProfile = {
          ...loyaltyProfile,
          currentPoints: newCurrentPoints,
          totalPointsEarned: newTotalPointsEarned,
          tier: newTier,
          lastActivity: new Date(),
          updatedAt: new Date()
        };

        // Perform updates in a transaction
        await db.runTransaction(async (transaction) => {
          transaction.update(loyaltyRef, updatedLoyaltyProfile);
          transaction.set(db.collection('pointsTransactions').doc(transactionId), transaction);
          
          // If tier upgraded, create additional transaction record
          if (newTier !== loyaltyProfile.tier) {
            const tierUpgradeTransactionId = `tier_upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const tierUpgradeTransaction: PointsTransaction = {
              id: tierUpgradeTransactionId,
              userId,
              type: 'earned',
              points: 0,
              description: `Tier upgraded to ${newTier}!`,
              createdAt: new Date(),
              metadata: {
                source: 'tier_upgrade',
                previousTier: loyaltyProfile.tier,
                newTier,
                triggerTransactionId: transactionId
              }
            };
            transaction.set(db.collection('pointsTransactions').doc(tierUpgradeTransactionId), tierUpgradeTransaction);
          }
        });

        console.log('Points awarded successfully:', {
          userId,
          pointsAwarded: pointsToAward,
          newBalance: newCurrentPoints,
          tierUpgrade: newTier !== loyaltyProfile.tier ? `${loyaltyProfile.tier} -> ${newTier}` : null
        });

        return res.status(200).json({
          received: true,
          message: `Awarded ${pointsToAward} points to user ${userId}`
        });
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);
        
        // Log the failed payment but don't award points
        return res.status(200).json({
          received: true,
          message: 'Payment failed, no points awarded'
        });
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        console.log('New customer created:', customer.id);
        
        // Optionally create loyalty profile when customer is created
        // This would require the userId to be set in customer metadata
        return res.status(200).json({
          received: true,
          message: 'Customer created'
        });
      }

      default:
        console.log('Unhandled event type:', event.type);
        return res.status(200).json({
          received: true,
          message: `Unhandled event type: ${event.type}`
        });
    }

  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return res.status(500).json({
      received: false,
      error: 'Internal server error'
    });
  }
}