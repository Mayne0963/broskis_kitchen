import { loadStripe } from '@stripe/stripe-js'

// Environment guard for Stripe publishable key
const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key || key === 'your-stripe-publishable-key-here') {
    console.warn('Stripe publishable key not configured properly')
    return null
  }
  return key
}

const stripePromise = (() => {
  const key = getStripePublishableKey()
  return key ? loadStripe(key) : null
})()

export default stripePromise