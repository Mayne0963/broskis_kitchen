import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/session';
import Stripe from 'stripe';
import { adb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });
} else {
  console.error('Stripe secret key is missing');
}

// Helper to get Stripe customer ID
async function getStripeCustomerId(userId: string) {
  const userRef = adb.collection(COLLECTIONS.USERS).doc(userId);
  const userSnap = await userRef.get();
  return userSnap.data()?.stripeCustomerId;
}

// GET: Fetch payment history
export async function GET(request: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    const session = await getSessionCookie();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const customerId = await getStripeCustomerId(session.uid);
    if (!customerId) return NextResponse.json([]);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const charges = await stripe.charges.list({ customer: customerId, limit });
    const history = charges.data.map(charge => ({
      id: charge.id,
      date: new Date(charge.created * 1000).toISOString(),
      amount: charge.amount / 100,
      method: charge.payment_method_details?.card?.brand || 'Unknown',
      status: charge.status
    }));
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}