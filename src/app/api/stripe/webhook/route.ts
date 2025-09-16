import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      try {
        // Retrieve full session with line items
        let fullSession: Stripe.Checkout.Session;
        try {
          fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items.data.price.product']
          });
        } catch (expandError) {
          // Fallback if product expand fails
          fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items']
          });
        }

        // Build order object
        const order = {
          id: fullSession.id,
          payment_intent: fullSession.payment_intent,
          amount_total: fullSession.amount_total,
          currency: fullSession.currency,
          customer_details: {
            email: fullSession.customer_details?.email || null,
            name: fullSession.customer_details?.name || null,
            phone: fullSession.customer_details?.phone || null,
            address: fullSession.customer_details?.address || null
          },
          created: Timestamp.now(),
          items: fullSession.line_items?.data?.map(item => ({
            name: item.description || 'Unknown Item',
            quantity: item.quantity || 1,
            unit_amount: item.price?.unit_amount || 0,
            subtotal: (item.price?.unit_amount || 0) * (item.quantity || 1),
            productId: typeof item.price?.product === 'object' ? item.price.product.id : item.price?.product || undefined
          })) || [],
          mode: fullSession.mode,
          status: 'paid' as const
        };

        // Write to Firestore using detected collection name
        const db = getAdminDb();
        await db.collection(COLLECTIONS.ORDERS).doc(fullSession.id).set(order);

        console.log(`Order ${fullSession.id} written to Firestore`);
      } catch (error) {
        console.error('Error processing checkout session:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}