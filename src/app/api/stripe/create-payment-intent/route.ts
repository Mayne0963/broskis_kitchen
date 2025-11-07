import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'



export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key is missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
    const { 
      amount, 
      currency = 'usd', 
      metadata = {}, 
      payment_method_types,
      payment_method,
      confirm = false 
    } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Stripe minimum charge validation
    const MIN_USD_CENTS = 50;
    const amountInCents = Math.round(amount * 100);
    if (currency === 'usd' && amountInCents < MIN_USD_CENTS) {
      return NextResponse.json(
        { error: 'Minimum charge is $0.50 USD. Please add more items.' },
        { status: 400 }
      );
    }

    // Prepare payment intent options
    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        ...metadata,
        source: 'broskis-kitchen',
      },
    }

    // Handle specific payment method types
    if (payment_method_types && Array.isArray(payment_method_types)) {
      // Ensure CashApp is properly configured
      if (payment_method_types.includes('cashapp')) {
        paymentIntentOptions.payment_method_types = ['cashapp']
        paymentIntentOptions.automatic_payment_methods = undefined
      } else {
        paymentIntentOptions.payment_method_types = payment_method_types
      }
    } else {
      // Enable automatic payment methods for cards, digital wallets, etc.
      paymentIntentOptions.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'always', // Allow redirects for methods like CashApp
      }
    }

    // If payment method is provided, attach it
    if (payment_method) {
      paymentIntentOptions.payment_method = payment_method
    }

    // If confirm is true, confirm the payment immediately
    if (confirm) {
      paymentIntentOptions.confirm = true
      paymentIntentOptions.return_url = `${process.env.BASE_URL || 'https://broskiskitchen.com'}/checkout/success`
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentIntent: paymentIntent,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}