import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/session';
import Stripe from 'stripe';
import { db } from '@/lib/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' });

// Helper to get Stripe customer ID
async function getStripeCustomerId(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.data()?.stripeCustomerId;
}

// GET: Fetch payment history
export async function GET(request: NextRequest) {
  try {
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