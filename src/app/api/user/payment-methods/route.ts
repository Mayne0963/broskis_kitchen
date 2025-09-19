export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/session';
import Stripe from 'stripe';
import { adb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
  });
} else {
  console.error('Stripe secret key is missing');
}

// Helper to get or create Stripe customer ID
async function getStripeCustomerId(userId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  const userRef = adb.collection(COLLECTIONS.USERS).doc(userId);
  const userSnap = await userRef.get();
  let customerId = userSnap.data()?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({});
    customerId = customer.id;
    await userRef.set({ stripeCustomerId: customerId }, { merge: true });
  }
  return customerId;
}

// GET: List payment methods
export async function GET() {
  try {
    if (!stripe) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    const session = await getSessionCookie();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const customerId = await getStripeCustomerId(session.uid);
    const paymentMethods = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    return NextResponse.json(paymentMethods.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Attach new payment method
export async function POST(request: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    const session = await getSessionCookie();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { paymentMethodId } = await request.json();
    const customerId = await getStripeCustomerId(session.uid);
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    return NextResponse.json(paymentMethod);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Detach payment method
export async function DELETE(request: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    const session = await getSessionCookie();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { paymentMethodId } = await request.json();
    await stripe.paymentMethods.detach(paymentMethodId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}