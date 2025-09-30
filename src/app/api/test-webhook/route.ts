// Test endpoint to verify webhook logic without signature validation
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase/admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    console.log('Test webhook received event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing checkout session:', session.id);

        try {
          // Fetch line items (mock for testing)
          const mockLineItems = {
            data: [
              {
                description: 'Test Product 1',
                quantity: 2,
                amount_subtotal: 1999,
                amount_total: 1999
              },
              {
                description: 'Test Product 2', 
                quantity: 1,
                amount_subtotal: 1000,
                amount_total: 1000
              }
            ]
          };

          // Build normalized order document
          const orderDoc = {
            id: session.id,
            source: 'stripe',
            status: 'paid',
            userId: session.metadata?.userId || session.client_reference_id || null,
            email: session.customer_details?.email || null,
            amount: session.amount_total ?? null,
            currency: session.currency ?? 'usd',
            items: mockLineItems.data.map(item => ({
              name: item.description,
              quantity: item.quantity,
              amount_subtotal: item.amount_subtotal,
              amount_total: item.amount_total
            })),
            createdAt: Timestamp.now()
          };

          // Save to Firestore
          await adminDb.collection('orders').doc(session.id).set(orderDoc, { merge: true });
          console.log('✅ Order document saved for session:', session.id);

        } catch (error) {
          console.error('❌ Error processing checkout session:', error);
          // Don't throw - we don't want to fail the webhook
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing payment intent:', paymentIntent.id);

        try {
          // Build normalized order document
          const orderDoc = {
            id: paymentIntent.id,
            source: 'stripe',
            status: 'paid',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            createdAt: Timestamp.now()
          };

          // Save to Firestore
          await adminDb.collection('orders').doc(paymentIntent.id).set(orderDoc, { merge: true });
          console.log('✅ Order document saved for payment intent:', paymentIntent.id);

        } catch (error) {
          console.error('❌ Error processing payment intent:', error);
          // Don't throw - we don't want to fail the webhook
        }
        break;
      }

      default:
        console.log('🔍 Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true, processed: event.type });

  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json(
      { error: 'Test webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}