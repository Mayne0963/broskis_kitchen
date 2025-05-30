import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { updateOrderStatus } from '@/lib/services/orderService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = headers()
  const sig = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)
        
        // Extract order ID from metadata
        const orderId = paymentIntent.metadata?.orderId
        if (orderId) {
          await updateOrderStatus(orderId, 'confirmed')
          console.log(`Order ${orderId} status updated to confirmed`)
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedPayment.id)
        
        // Extract order ID from metadata
        const failedOrderId = failedPayment.metadata?.orderId
        if (failedOrderId) {
          await updateOrderStatus(failedOrderId, 'cancelled')
          console.log(`Order ${failedOrderId} status updated to cancelled due to payment failure`)
        }
        break

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment canceled:', canceledPayment.id)
        
        // Extract order ID from metadata
        const canceledOrderId = canceledPayment.metadata?.orderId
        if (canceledOrderId) {
          await updateOrderStatus(canceledOrderId, 'cancelled')
          console.log(`Order ${canceledOrderId} status updated to cancelled`)
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}