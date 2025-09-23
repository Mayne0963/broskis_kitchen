import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    STRIPE_SECRET_KEY: !! process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !! process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !! process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
   });
}