'use client'

import React, { useState, useEffect } from 'react'
import {
  PaymentRequestButtonElement,
  useStripe,
} from '@stripe/react-stripe-js'
import { PaymentRequest } from '@stripe/stripe-js'
import { Smartphone, CreditCard } from 'lucide-react'

interface PaymentRequestButtonProps {
  amount: number
  currency?: string
  onPaymentSuccess: (paymentMethodId: string, paymentDetails: any) => void
  onPaymentError: (error: string) => void
  disabled?: boolean
  orderMetadata?: Record<string, string>
}

export default function PaymentRequestButton({
  amount,
  currency = 'usd',
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  orderMetadata = {},
}: PaymentRequestButtonProps) {
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [canMakePayment, setCanMakePayment] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!stripe || amount <= 0) {
      setIsLoading(false)
      return
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: currency.toLowerCase(),
      total: {
        label: 'Broskis Kitchen Order',
        amount: Math.round(amount * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
    })

    // Check if the browser supports payment request API
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr)
        setCanMakePayment(true)
      }
      setIsLoading(false)
    })

    // Handle payment method event
    pr.on('paymentmethod', async (event) => {
      try {
        setIsLoading(true)
        
        // Create payment intent on the server
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amountCents: Math.round(amount * 100),
            currency,
            payment_method: event.paymentMethod.id,
            confirm: true,
            metadata: {
              source: 'broskis-kitchen-payment-request',
              paymentType: 'digital_wallet',
              ...orderMetadata,
            },
          }),
        })

        if (!response.ok) {
          throw new Error('Payment failed')
        }

        const { paymentIntent } = await response.json()

        if (paymentIntent.status === 'succeeded') {
          event.complete('success')
          onPaymentSuccess(event.paymentMethod.id, {
            paymentIntentId: paymentIntent.id,
            paymentMethod: event.paymentMethod,
            billingDetails: event.paymentMethod.billing_details,
            type: 'digital_wallet',
          })
        } else {
          event.complete('fail')
          onPaymentError('Payment was not completed successfully')
        }
      } catch (error) {
        console.error('Payment Request error:', error)
        event.complete('fail')
        onPaymentError(error instanceof Error ? error.message : 'Payment failed')
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      // Cleanup
      pr.off('paymentmethod')
    }
  }, [stripe, amount, currency, onPaymentSuccess, onPaymentError, orderMetadata])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-[var(--color-dark-charcoal)] rounded-lg border border-gray-600">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-harvest-gold)]"></div>
        <span className="ml-2 text-gray-300">Checking payment options...</span>
      </div>
    )
  }

  if (!canMakePayment || !paymentRequest) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-3">
        <Smartphone className="w-5 h-5 text-[var(--color-harvest-gold)]" />
        <span className="text-white font-medium">Express Checkout</span>
      </div>
      
      <div className="bg-[var(--color-dark-charcoal)] p-4 rounded-lg border border-gray-600">
        <PaymentRequestButtonElement
          options={{
            paymentRequest,
            style: {
              paymentRequestButton: {
                type: 'default',
                theme: 'dark',
                height: '48px',
              },
            },
          }}
        />
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400">
            Pay securely with Apple Pay, Google Pay, or your saved payment methods
          </p>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="flex-1 border-t border-gray-600"></div>
        <span className="px-3 text-gray-400 text-sm">or</span>
        <div className="flex-1 border-t border-gray-600"></div>
      </div>
    </div>
  )
}
