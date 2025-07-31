import { loadStripe } from '@stripe/stripe-js'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : Promise.resolve(null as any)

export default stripePromise
