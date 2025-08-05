'use client'

import React, { useState, useEffect } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { FaLock, FaSpinner } from 'react-icons/fa'
import { toast } from '@/hooks/use-toast'

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
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency: 'usd',
            metadata: {
              source: 'broskis-kitchen-checkout',
              orderId: orderId || '',
              ...orderMetadata,
            },
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText || 'Payment intent creation failed'}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        setClientSecret(data.clientSecret)
      } catch (error) {
        console.error('Error creating payment intent:', error)
        onPaymentError('Failed to initialize payment')
      }
    }

    if (amount > 0) {
      createPaymentIntent()
    }
  }, [amount, onPaymentError])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

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
        toast({
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully.',
        })
      } else {
        throw new Error('Payment was not completed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      onPaymentError(errorMessage)
      toast({
        title: 'Payment Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-gold-foil text-xl" />
        <span className="ml-2">Initializing payment...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaLock className="mr-2 text-gold-foil" />
          Secure Payment
        </h3>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || isLoading || disabled}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
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
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: props.amount,
            currency: 'usd',
            metadata: {
              source: 'broskis-kitchen-checkout',
              orderId: props.orderId || '',
              ...props.orderMetadata,
            },
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText || 'Payment intent creation failed'}`)
        }

        const data = await response.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else if (data.error) {
          throw new Error(data.error)
        }
      } catch (error) {
        console.error('Error creating payment intent:', error)
        props.onPaymentError('Failed to initialize payment')
      }
    }

    if (props.amount > 0) {
      createPaymentIntent()
    }
  }, [props.amount, props.orderId, props.orderMetadata, props.onPaymentError])

  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#D4AF37',
        colorBackground: '#1A1A1A',
        colorText: '#FFFFFF',
        colorDanger: '#df1b41',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-gold-foil text-xl" />
        <span className="ml-2">Loading payment form...</span>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  )
}