import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/session';
import Stripe from 'stripe';
import { db } from '@/lib/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2025-02-24.acacia' })
  : null;

// Helper to get or create Stripe customer ID
async function getStripeCustomerId(userId: string) {
  if (!stripe) return null;
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  let customerId = userSnap.data()?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({});
    customerId = customer.id;
    await setDoc(userRef, { stripeCustomerId: customerId }, { merge: true });
  }
  return customerId;
}

// GET: List payment methods
export async function GET() {
  try {
    const session = await getSessionCookie();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    const customerId = await getStripeCustomerId(session.uid);
    if (!customerId) return NextResponse.json([]);
    const paymentMethods = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    return NextResponse.json(paymentMethods.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Attach new payment method
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    const { paymentMethodId } = await request.json();
    const customerId = await getStripeCustomerId(session.uid);
    if (!customerId) return NextResponse.json({ error: 'No customer' }, { status: 400 });
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    return NextResponse.json(paymentMethod);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Detach payment method
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    const { paymentMethodId } = await request.json();
    await stripe.paymentMethods.detach(paymentMethodId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}