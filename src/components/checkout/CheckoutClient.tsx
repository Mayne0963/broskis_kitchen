"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ShoppingCart, MapPin, CreditCard, Clock, Check } from 'lucide-react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import CartSummary from './CartSummary'
import DeliveryStep from './DeliveryStep'
import PaymentStep from './PaymentStep'
import ReviewStep from './ReviewStep'
import OrderConfirmation from './OrderConfirmation'
import { guestOrderUtils } from '@/utils/guestOrderTracking'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  customizations?: {
    [categoryId: string]: CustomizationOption[]
  }
}

interface CustomizationOption {
  id: string
  name: string
  price: number
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
  isAuthenticated: boolean
  userEmail: string
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
  paymentType?: 'card' | 'digital_wallet' | 'cashapp'
  guestEmail?: string
  guestPhone?: string
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
  userId,
  isAuthenticated,
  userEmail
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
  
  // Load saved checkout data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('checkoutData')
    const savedStep = localStorage.getItem('checkoutStep')
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setCheckoutData(parsedData)
      } catch (error) {
        console.error('Error parsing saved checkout data:', error)
      }
    }
    
    if (savedStep && ['delivery', 'payment', 'review'].includes(savedStep)) {
      setCurrentStep(savedStep as CheckoutStep)
    }
  }, [])
  
  // Save checkout data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData))
  }, [checkoutData])
  
  // Save current step to localStorage whenever it changes
  useEffect(() => {
    if (currentStep !== 'confirmation') {
      localStorage.setItem('checkoutStep', currentStep)
    } else {
      // Clear saved data when order is completed
      localStorage.removeItem('checkoutData')
      localStorage.removeItem('checkoutStep')
    }
  }, [currentStep])
  
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
          // For delivery, need either selected address or valid new address
          if (checkoutData.selectedAddress) return true
          if (checkoutData.newAddress) {
            const { street, city, state, zipCode } = checkoutData.newAddress
            return !!(street && city && state && zipCode)
          }
          return false
        }
        return true // Pickup doesn't require address
      case 'payment':
        return !!(checkoutData.selectedPayment || checkoutData.newPayment)
      case 'review':
        // Ensure all required data is present for final review
        const hasAddress = checkoutData.deliveryType === 'pickup' || 
                          checkoutData.selectedAddress || 
                          (checkoutData.newAddress?.street && checkoutData.newAddress?.city)
        const hasPayment = !!(checkoutData.selectedPayment || checkoutData.newPayment)
        return hasAddress && hasPayment
      default:
        return false
    }
  }
  
  const handleNext = () => {
    const stepIndex = getCurrentStepIndex()
    if (stepIndex < steps.length - 1) {
      if (canProceedToNext()) {
        setError(null) // Clear any previous errors
        setCurrentStep(steps[stepIndex + 1].id as CheckoutStep)
      } else {
        // Show specific error message based on current step
        let errorMessage = ''
        switch (currentStep) {
          case 'delivery':
            if (checkoutData.deliveryType === 'delivery') {
              errorMessage = 'Please select or add a delivery address to continue.'
            }
            break
          case 'payment':
            errorMessage = 'Please select or add a payment method to continue.'
            break
          case 'review':
            errorMessage = 'Please complete all required information before placing your order.'
            break
        }
        setError(errorMessage)
      }
    }
  }
  
  const handlePrevious = () => {
    const stepIndex = getCurrentStepIndex()
    if (stepIndex > 0) {
      setError(null) // Clear any previous errors
      setCurrentStep(steps[stepIndex - 1].id as CheckoutStep)
    }
  }
  
  const handleEditStep = (step: CheckoutStep) => {
    setCurrentStep(step)
  }
  
  const handlePlaceOrder = async () => {
    setIsProcessing(true)
    
    try {
      // Calculate item prices including customizations
      const calculateItemPrice = (item: CartItem) => {
        let price = item.price
        if (item.customizations) {
          Object.values(item.customizations).flat().forEach(option => {
            price += option.price || 0
          })
        }
        return price
      }
      
      // Create order data with proper item pricing
      const orderItems = cartData.items.map(item => ({
        ...item,
        totalPrice: calculateItemPrice(item) * item.quantity,
        customizationText: item.customizations 
          ? Object.values(item.customizations).flat().map(opt => opt.name).join(', ')
          : ''
      }))
      
      const orderData = {
        items: orderItems,
        subtotal: cartData.subtotal,
        tax: cartData.tax,
        deliveryFee: cartData.deliveryFee,
        total: cartData.total,
        orderType: checkoutData.deliveryType,
        deliveryAddress: checkoutData.deliveryType === 'delivery' ? checkoutData.selectedAddress : undefined,
        pickupLocation: checkoutData.deliveryType === 'pickup' ? 'Main Location' : undefined,
        contactInfo: {
          email: isAuthenticated 
            ? (checkoutData.selectedAddress?.email || userEmail || 'customer@example.com')
            : (checkoutData.guestEmail || 'guest@example.com'),
          phone: isAuthenticated 
            ? (checkoutData.selectedAddress?.phone || '555-0123')
            : (checkoutData.guestPhone || '555-0123')
        },
        paymentInfo: {
          method: checkoutData.paymentType || checkoutData.selectedPayment?.type || 'card',
          last4: checkoutData.selectedPayment?.last4 || checkoutData.newPayment?.paymentDetails?.last4 || '****',
          paymentType: checkoutData.paymentType,
          paymentMethodId: checkoutData.newPayment?.paymentMethodId || checkoutData.selectedPayment?.id
        },
        specialInstructions: checkoutData.specialInstructions,
        tip: checkoutData.tip,
        rewardsUsed: checkoutData.useRewards,
        rewardsPoints: checkoutData.rewardsPoints,
        userId: isAuthenticated ? userId : null
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
      
      // Store order for guest users
       if (!isAuthenticated && guestOrderUtils.isClient()) {
         guestOrderUtils.saveGuestOrder({
           orderId: order.id,
           email: checkoutData.guestEmail || 'guest@example.com',
           phone: checkoutData.guestPhone || '555-0123',
           total: order.total,
           status: order.status
         })
       }
      
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
      
      // Handle different payment types
      if (checkoutData.newPayment) {
        // Payment already processed via new payment methods
        if (checkoutData.newPayment.type === 'digital_wallet') {
          console.log('Digital wallet payment completed:', checkoutData.newPayment.paymentDetails)
        } else if (checkoutData.newPayment.type === 'cashapp') {
          console.log('CashApp payment completed:', checkoutData.newPayment.paymentDetails)
        } else if (checkoutData.newPayment.type === 'stripe') {
          // Traditional Stripe payment - confirm if needed
          if (checkoutData.newPayment.paymentIntentId) {
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
          }
        }
        
        // Update order status to confirmed
        await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            status: 'confirmed',
            paymentMethod: checkoutData.newPayment.type,
            paymentDetails: {
              type: checkoutData.newPayment.type,
              amount: checkoutData.newPayment.amount,
              status: checkoutData.newPayment.status
            }
          })
        })
      } else if (checkoutData.selectedPayment) {
        // Using existing payment method - would need additional processing
        console.log('Using existing payment method:', checkoutData.selectedPayment)
        // For now, simulate successful payment with existing method
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Update order status to confirmed
        await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            status: 'confirmed',
            paymentMethod: 'existing_card',
            paymentDetails: {
              type: 'card',
              last4: checkoutData.selectedPayment.last4,
              brand: checkoutData.selectedPayment.brand
            }
          })
        })
      }
       
       setOrderId(order.id)
       setCurrentStep('confirmation')
    } catch (error) {
      console.error('Error placing order:', error)
      let errorMessage = 'Failed to place order. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('payment')) {
          errorMessage = 'Payment processing failed. Please check your payment method and try again.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
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
            isAuthenticated={isAuthenticated}
          />
        )
      case 'payment':
        return (
          <Elements stripe={stripePromise}>
            <PaymentStep
              paymentMethods={paymentMethods}
              checkoutData={checkoutData}
              cartData={cartData}
              onUpdate={updateCheckoutData}
            />
          </Elements>
        )
      case 'review':
        return (
          <ReviewStep
            cartData={cartData}
            checkoutData={checkoutData}
            onUpdate={updateCheckoutData}
            onPlaceOrder={handlePlaceOrder}
            onEditStep={handleEditStep}
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
        {/* Desktop Progress Steps */}
        <div className="hidden md:flex items-center justify-between">
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
        
        {/* Mobile Progress Steps */}
        <div className="md:hidden">
          <div className="flex items-center justify-center space-x-2 mb-4">
            {steps.slice(0, -1).map((step, index) => {
              const isActive = step.id === currentStep
              const isCompleted = getCurrentStepIndex() > index
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-3 h-3 rounded-full transition-all
                    ${
                      isCompleted
                        ? 'bg-[var(--color-harvest-gold)]'
                        : isActive
                        ? 'bg-[var(--color-harvest-gold)]'
                        : 'bg-[#FFD700]/30'
                    }
                  `} />
                  {index < steps.length - 2 && (
                    <div className={`
                      w-8 h-0.5 mx-2
                      ${
                        isCompleted
                          ? 'bg-[var(--color-harvest-gold)]'
                          : 'bg-[#FFD700]/30'
                      }
                    `} />
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Current Step Title */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">
              Step {getCurrentStepIndex() + 1} of {steps.length - 1}: {steps.find(s => s.id === currentStep)?.title}
            </h3>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Step Content */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-4 sm:p-6 border border-[var(--color-harvest-gold)]/20">
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          {currentStep !== 'confirmation' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-6 gap-4 sm:gap-0">
              <button
                onClick={handlePrevious}
                disabled={getCurrentStepIndex() === 0}
                className="btn-outline order-2 sm:order-1"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>
              
              {currentStep !== 'review' ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="btn-primary order-1 sm:order-2"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || !canProceedToNext()}
                  className="btn-primary order-1 sm:order-2"
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
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="sticky top-4">
            <CartSummary 
              cartData={cartData}
              checkoutData={checkoutData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}