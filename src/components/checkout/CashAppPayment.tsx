'use client'

import React, { useState } from 'react'
import { useStripe, useElements } from '@stripe/react-stripe-js'
import { Smartphone, DollarSign } from 'lucide-react'

interface CashAppPaymentProps {
  amount: number
  currency?: string
  onPaymentSuccess: (paymentMethodId: string, paymentDetails: any) => void
  onPaymentError: (error: string) => void
  disabled?: boolean
  orderMetadata?: Record<string, string>
}

export default function CashAppPayment({
  amount,
  currency = 'usd',
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  orderMetadata = {},
}: CashAppPaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCashAppPayment = async () => {
    if (!stripe || disabled || isProcessing) {
      return
    }

    setIsProcessing(true)

    try {
      // Create payment intent with CashApp payment method
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          payment_method_types: ['cashapp'],
          metadata: {
            source: 'broskis-kitchen-cashapp',
            paymentType: 'cashapp',
            ...orderMetadata,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Confirm payment with CashApp
      const { error, paymentIntent } = await stripe.confirmCashappPayment(
        clientSecret,
        {
          return_url: `${window.location.origin}/checkout?success=true`,
        }
      )

      if (error) {
        throw new Error(error.message || 'CashApp payment failed')
      }

      if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          onPaymentSuccess(paymentIntent.payment_method?.id || '', {
            paymentIntentId: paymentIntent.id,
            paymentMethod: paymentIntent.payment_method,
            type: 'cashapp',
            status: 'succeeded'
          })
        } else if (paymentIntent.status === 'requires_action') {
          // Handle redirect case - CashApp will redirect back
          console.log('CashApp payment requires action, redirecting...')
        } else {
          throw new Error(`Payment failed with status: ${paymentIntent.status}`)
        }
      }
    } catch (error) {
      console.error('CashApp payment error:', error)
      onPaymentError(error instanceof Error ? error.message : 'CashApp payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-3">
        <DollarSign className="w-5 h-5 text-[var(--color-harvest-gold)]" />
        <span className="text-white font-medium">CashApp Pay</span>
      </div>
      
      <div className="bg-[var(--color-dark-charcoal)] p-4 rounded-lg border border-gray-600">
        <button
          onClick={handleCashAppPayment}
          disabled={disabled || isProcessing || !stripe}
          className="w-full bg-[#00D632] hover:bg-[#00B82A] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Smartphone className="w-5 h-5" />
              <span>Pay with CashApp</span>
              <span className="font-bold">${amount.toFixed(2)}</span>
            </>
          )}
        </button>
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400">
            You'll be redirected to CashApp to complete your payment
          </p>
        </div>
      </div>
    </div>
  )
}