'use client'

import React, { useState, useEffect } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface StripePaymentFormProps {
  amount: number
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
  disabled?: boolean
  orderId?: string
  orderMetadata?: Record<string, string>
}

function PaymentForm({
  amount,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  orderId,
  orderMetadata = {},
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!stripe || !elements || disabled) {
      return
    }

    setIsLoading(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (error) {
        throw new Error(error.message || 'Payment failed')
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id)
        toast.success('Payment processed successfully!')
      } else {
        throw new Error('Payment was not completed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      setError(errorMessage)
      onPaymentError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[var(--color-dark-charcoal)] p-6 rounded-lg border border-gray-600">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
          <Lock className="mr-2 text-[var(--color-harvest-gold)] w-5 h-5" />
          Secure Payment
        </h3>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isLoading || disabled}
        className="w-full bg-[var(--color-harvest-gold)] hover:bg-[var(--color-gold-rich)] text-black font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin mr-2 w-4 h-4" />
            Processing Payment...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </button>
    </form>
  )
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const { amount, orderId, orderMetadata, onPaymentError } = props
  const [clientSecret, setClientSecret] = useState('')
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (amount <= 0) {
        onPaymentError('Invalid payment amount')
        return
      }

      setIsInitializing(true)
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amountCents: Math.round(amount * 100), // send cents to server
            currency: 'usd',
            metadata: {
              source: 'broskis-kitchen-checkout',
              orderId: orderId || '',
              ...orderMetadata,
            },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }))
          throw new Error(errorData.error || `HTTP ${response.status}: Payment setup failed`)
        }

        const data = await response.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          throw new Error(data.error || 'No client secret received')
        }
      } catch (error) {
        console.error('Error creating payment intent:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment'
        onPaymentError(errorMessage)
      } finally {
        setIsInitializing(false)
      }
    }

    createPaymentIntent()
  }, [amount, orderId, orderMetadata, onPaymentError])

  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#D4AF37',
        colorBackground: '#2A2A2A',
        colorText: '#FFFFFF',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }

  if (isInitializing || !clientSecret) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--color-dark-charcoal)] rounded-lg border border-gray-600">
        <Loader2 className="animate-spin text-[var(--color-harvest-gold)] w-6 h-6" />
        <span className="ml-2 text-gray-300">Initializing secure payment...</span>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  )
}
