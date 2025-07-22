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
      setCurrentStep(steps[stepIndex + 1].id as CheckoutStep)
    }
  }
  
  const handlePrevious = () => {
    const stepIndex = getCurrentStepIndex()
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id as CheckoutStep)
    }
  }
  
  const handlePlaceOrder = async () => {
    setIsProcessing(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/checkout/place-order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     userId,
      //     cartData,
      //     checkoutData
      //   })
      // })
      // const result = await response.json()
      
      // Mock delay and success
      await new Promise(resolve => setTimeout(resolve, 2000))
      const mockOrderId = `BK-${Date.now()}`
      setOrderId(mockOrderId)
      setCurrentStep('confirmation')
    } catch (error) {
      console.error('Failed to place order:', error)
      // Handle error - show toast or error message
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
                      : 'border-gray-600 text-gray-400'
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
                        : 'text-gray-400'
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
                        : 'bg-gray-600'
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
                className="
                  flex items-center px-6 py-3 rounded-lg font-semibold transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  bg-gray-700 text-white hover:bg-gray-600
                "
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>
              
              {currentStep !== 'review' ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="
                    flex items-center px-6 py-3 rounded-lg font-semibold transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    bg-[var(--color-harvest-gold)] text-black hover:bg-[var(--color-harvest-gold)]/90
                  "
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !canProceedToNext()}
                  className="
                    flex items-center px-8 py-3 rounded-lg font-semibold transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    bg-[var(--color-harvest-gold)] text-black hover:bg-[var(--color-harvest-gold)]/90
                  "
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