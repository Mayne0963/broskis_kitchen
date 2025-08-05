"use client"

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ShoppingCart, MapPin, CreditCard, Clock, Check } from 'lucide-react'
import CartSummary from './CartSummary'
import DeliveryStep from './DeliveryStep'
import PaymentStep from './PaymentStep'
import ReviewStep from './ReviewStep'
import OrderConfirmation from './OrderConfirmation'

interface CartItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  image: string
  customizations: string[]
}

interface CartData {
  items: CartItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
}

interface Address {
  id: string
  type: string
  street: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

interface PaymentMethod {
  id: string
  type: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

interface CheckoutClientProps {
  cartData: CartData
  addresses: Address[]
  paymentMethods: PaymentMethod[]
  userId: string
}

type CheckoutStep = 'delivery' | 'payment' | 'review' | 'confirmation'

interface CheckoutData {
  deliveryType: 'delivery' | 'pickup'
  selectedAddress?: Address
  newAddress?: Partial<Address>
  selectedPayment?: PaymentMethod
  newPayment?: any
  deliveryTime: 'asap' | 'scheduled'
  scheduledTime?: Date
  specialInstructions: string
  tip: number
  useRewards: boolean
  rewardsPoints: number
}

const steps = [
  { id: 'delivery', title: 'Delivery', icon: MapPin },
  { id: 'payment', title: 'Payment', icon: CreditCard },
  { id: 'review', title: 'Review', icon: ShoppingCart },
  { id: 'confirmation', title: 'Confirmation', icon: Check }
]

export default function CheckoutClient({ 
  cartData, 
  addresses, 
  paymentMethods, 
  userId 
}: CheckoutClientProps) {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('delivery')
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    deliveryType: 'delivery',
    deliveryTime: 'asap',
    specialInstructions: '',
    tip: 0,
    useRewards: false,
    rewardsPoints: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const updateCheckoutData = (updates: Partial<CheckoutData>) => {
    setCheckoutData(prev => ({ ...prev, ...updates }))
  }
  
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep)
  }
  
  const canProceedToNext = () => {
    switch (currentStep) {
      case 'delivery':
        if (checkoutData.deliveryType === 'delivery') {
          return checkoutData.selectedAddress || checkoutData.newAddress
        }
        return true
      case 'payment':
        return checkoutData.selectedPayment || checkoutData.newPayment
      case 'review':
        return true
      default:
        return false
    }
  }
  
  const handleNext = () => {
    const stepIndex = getCurrentStepIndex()
    if (stepIndex < steps.length - 1 && canProceedToNext()) {
      setError(null) // Clear any previous errors
      setCurrentStep(steps[stepIndex + 1].id as CheckoutStep)
    }
  }
  
  const handlePrevious = () => {
    const stepIndex = getCurrentStepIndex()
    if (stepIndex > 0) {
      setError(null) // Clear any previous errors
      setCurrentStep(steps[stepIndex - 1].id as CheckoutStep)
    }
  }
  
  const handlePlaceOrder = async () => {
    setIsProcessing(true)
    
    try {
      // Create order data
      const orderData = {
        items: cartData.items,
        subtotal: cartData.subtotal,
        tax: cartData.tax,
        orderType: checkoutData.deliveryType,
        deliveryAddress: checkoutData.deliveryType === 'delivery' ? checkoutData.selectedAddress : undefined,
        pickupLocation: checkoutData.deliveryType === 'pickup' ? 'Main Location' : undefined,
        contactInfo: {
          email: checkoutData.selectedAddress?.email || 'customer@example.com',
          phone: checkoutData.selectedAddress?.phone || '555-0123'
        },
        paymentInfo: {
          method: checkoutData.selectedPayment?.type || 'card',
          last4: checkoutData.selectedPayment?.last4 || '****'
        },
        specialInstructions: checkoutData.specialInstructions,
        userId: userId
      }

      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const { order } = await orderResponse.json()
      
      // Create payment intent
      const paymentResponse = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total,
          metadata: {
            orderId: order.id,
            orderType: order.orderType
          }
        })
      })

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { paymentIntentId } = await paymentResponse.json()
      
      // Check if payment was already processed via Stripe Elements
       if (checkoutData.newPayment?.paymentIntentId) {
         // Payment already processed, just confirm the order
         const confirmResponse = await fetch('/api/stripe/confirm-payment', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             paymentIntentId: checkoutData.newPayment.paymentIntentId
           })
         })

         if (!confirmResponse.ok) {
           throw new Error('Failed to confirm payment')
         }

         // Update order status to confirmed
         await fetch('/api/orders', {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             orderId: order.id,
             status: 'confirmed'
           })
         })
       } else if (checkoutData.selectedPayment) {
         // Using existing payment method - would need additional processing
         console.log('Using existing payment method:', checkoutData.selectedPayment)
         // For now, simulate successful payment with existing method
         await new Promise(resolve => setTimeout(resolve, 1000))
       }
       
       setOrderId(order.id)
       setCurrentStep('confirmation')
    } catch (error) {
      console.error('Error placing order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order'
      setError(errorMessage)
      // TODO: Show error toast to user
    } finally {
      setIsProcessing(false)
    }
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 'delivery':
        return (
          <DeliveryStep
            addresses={addresses}
            checkoutData={checkoutData}
            onUpdate={updateCheckoutData}
          />
        )
      case 'payment':
        return (
          <PaymentStep
            paymentMethods={paymentMethods}
            checkoutData={checkoutData}
            cartData={cartData}
            onUpdate={updateCheckoutData}
          />
        )
      case 'review':
        return (
          <ReviewStep
            cartData={cartData}
            checkoutData={checkoutData}
            onUpdate={updateCheckoutData}
            onPlaceOrder={handlePlaceOrder}
            isProcessing={isProcessing}
          />
        )
      case 'confirmation':
        return (
          <OrderConfirmation
            orderId={orderId!}
            cartData={cartData}
            checkoutData={checkoutData}
          />
        )
      default:
        return null
    }
  }
  
  if (currentStep === 'confirmation') {
    return renderStepContent()
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-400 font-medium">Error</div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.slice(0, -1).map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = getCurrentStepIndex() > index
            const Icon = step.icon
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                  ${
                    isCompleted
                      ? 'bg-[var(--color-harvest-gold)] border-[var(--color-harvest-gold)] text-black'
                      : isActive
                      ? 'border-[var(--color-harvest-gold)] text-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10'
                      : 'border-[#FFD700] text-[#FFD700]'
                  }
                `}>
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                
                <div className="ml-3">
                  <div className={`
                    font-semibold
                    ${
                      isCompleted || isActive
                        ? 'text-white'
                        : 'text-[#FFD700]'
                    }
                  `}>
                    {step.title}
                  </div>
                </div>
                
                {index < steps.length - 2 && (
                  <div className={`
                    w-16 h-0.5 mx-6
                    ${
                      isCompleted
                        ? 'bg-[var(--color-harvest-gold)]'
                        : 'bg-[#FFD700]'
                    }
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step Content */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          {currentStep !== 'confirmation' && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePrevious}
                disabled={getCurrentStepIndex() === 0}
                className="btn-outline"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>
              
              {currentStep !== 'review' ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="btn-primary"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !canProceedToNext()}
                  className="btn-primary"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order
                      <Check className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <CartSummary 
            cartData={cartData}
            checkoutData={checkoutData}
          />
        </div>
      </div>
    </div>
  )
}