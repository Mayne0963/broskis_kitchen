import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, Timestamp } from '@/lib/firebaseAdmin';
import { toOrderDocFromSession } from '@/lib/orders/normalizeStripeOrder';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`✅ Webhook signature verified for event: ${event.type}`);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('🛒 Checkout session completed:', session.id);
        
        try {
          // Fetch line items from Stripe
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
          
          // Build normalized order document using helper function
          const orderDoc = toOrderDocFromSession(session, lineItems.data);
          
          // Save to Firestore with merge: true for idempotency
          await adminDb.collection('orders').doc(session.id).set(orderDoc, { merge: true });
          
          console.log('✅ Order document created/updated in Firestore:', session.id);
          console.log('📦 Order details:', orderDoc);
          
        } catch (firestoreError) {
          console.error('❌ Failed to save checkout session to Firestore:', firestoreError);
          // Don't throw - we still want to return 200 to Stripe
        }
        
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💳 Payment intent succeeded:', paymentIntent.id);
        
        try {
          // Create/update order document for payment intent
          const orderDoc = {
            id: paymentIntent.id,
            source: 'stripe',
            status: 'paid',
            amount: paymentIntent.amount || null,
            currency: paymentIntent.currency || 'usd',
            createdAt: Timestamp.now()
          };
          
          // Save to Firestore with merge: true for idempotency
          await adminDb.collection('orders').doc(paymentIntent.id).set(orderDoc, { merge: true });
          
          console.log('✅ Payment intent order document created/updated in Firestore:', paymentIntent.id);
          console.log('💰 Payment details:', orderDoc);
          
        } catch (firestoreError) {
          console.error('❌ Failed to save payment intent to Firestore:', firestoreError);
          // Don't throw - we still want to return 200 to Stripe
        }
        
        break;
      }
      
      default:
        // Log unrecognized events but don't break the handler
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        break;
    }

    // Return success response
    return NextResponse.json(
      { received: true, eventType: event.type },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Reject non-POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}