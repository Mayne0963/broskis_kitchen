export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/session';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebaseAdmin';
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
  const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
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
    if (!stripe) return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
    
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    const customerId = await getStripeCustomerId(user.uid);
    const paymentMethods = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify(paymentMethods.data), { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
  }
}

// POST: Attach new payment method
export async function POST(request: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
    
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    const { paymentMethodId } = await request.json();
    const customerId = await getStripeCustomerId(user.uid);
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify(paymentMethod), { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
  }
}

// DELETE: Detach payment method
export async function DELETE(request: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
    
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    const { paymentMethodId } = await request.json();
    await stripe.paymentMethods.detach(paymentMethodId);
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
  }
}