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
import { LoadingOverlay, ErrorState, ProgressIndicator, useLoadingState } from '../common/EnhancedLoadingStates'
import { toast } from 'sonner'
import { safeFetch } from '@/lib/utils/safeFetch'

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
  isAuthenticated
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
  const { isLoading: isStepLoading, error: stepError, withLoading, clearError } = useLoadingState()
  const [processingStep, setProcessingStep] = useState<string>('')
  
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
  
  const handleNext = async () => {
    const stepIndex = getCurrentStepIndex()
    if (stepIndex < steps.length - 1) {
      if (canProceedToNext()) {
        await withLoading(async () => {
          setError(null)
          clearError()
          // Simulate step transition delay
          await new Promise(resolve => setTimeout(resolve, 300))
          setCurrentStep(steps[stepIndex + 1].id as CheckoutStep)
        })
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
  
  const handlePrevious = async () => {
    const stepIndex = getCurrentStepIndex()
    if (stepIndex > 0) {
      await withLoading(async () => {
        setError(null)
        clearError()
        // Simulate step transition delay
        await new Promise(resolve => setTimeout(resolve, 200))
        setCurrentStep(steps[stepIndex - 1].id as CheckoutStep)
      })
    }
  }
  
  const handleEditStep = (step: CheckoutStep) => {
    setCurrentStep(step)
  }
  
  // read current items from provider or GET /api/cart
  async function startPayment(currentItems: any[]) {
    const res = await safeFetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: currentItems }),
    });
    const j = await res.json();
    if (j?.url) window.location.href = j.url;
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true)
    setError(null)
    clearError()
    
    try {
      setProcessingStep('Preparing checkout...')
      toast.loading('Redirecting to payment...', { id: 'order-processing' })
      
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
      
      // Prepare items for Stripe checkout
      const checkoutItems = cartData.items.map(item => ({
        name: item.name,
        price: calculateItemPrice(item),
        qty: item.quantity
      }))
      
      // Store order data in localStorage for retrieval after payment
      const orderData = {
        items: cartData.items.map(item => ({
          ...item,
          totalPrice: calculateItemPrice(item) * item.quantity,
          customizationText: item.customizations 
            ? Object.values(item.customizations).flat().map(opt => opt.name).join(', ')
            : ''
        })),
        subtotal: cartData.subtotal,
        tax: cartData.tax,
        deliveryFee: cartData.deliveryFee,
        total: cartData.total,
        orderType: checkoutData.deliveryType,
        deliveryAddress: checkoutData.deliveryType === 'delivery' ? checkoutData.selectedAddress : undefined,
        pickupLocation: checkoutData.deliveryType === 'pickup' ? 'Main Location' : undefined,
        contactInfo: {
          email: isAuthenticated 
            ? (checkoutData.selectedAddress?.email || 'customer@example.com')
            : (checkoutData.guestEmail || 'guest@example.com'),
          phone: isAuthenticated 
            ? (checkoutData.selectedAddress?.phone || '555-0123')
            : (checkoutData.guestPhone || '555-0123')
        },
        specialInstructions: checkoutData.specialInstructions,
        tip: checkoutData.tip,
        rewardsUsed: checkoutData.useRewards,
        rewardsPoints: checkoutData.rewardsPoints,
        userId: isAuthenticated ? userId : null
      }
      
      localStorage.setItem('pendingOrder', JSON.stringify(orderData))
      
      // Call the new checkout session API
      await startPayment(checkoutItems)
      
    } catch (error) {
      console.error('Error starting payment:', error)
      let errorMessage = 'Failed to start payment. Please try again.'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage, { id: 'order-processing' })
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 'delivery':
        return (
          <LoadingOverlay isLoading={isStepLoading} message="Loading delivery options...">
            <DeliveryStep
              addresses={addresses}
              checkoutData={checkoutData}
              onUpdate={updateCheckoutData}
              isAuthenticated={isAuthenticated}
            />
          </LoadingOverlay>
        )
      case 'payment':
        return (
          <LoadingOverlay isLoading={isStepLoading} message="Loading payment options...">
            <Elements stripe={stripePromise}>
              <PaymentStep
                paymentMethods={paymentMethods}
                checkoutData={checkoutData}
                cartData={cartData}
                onUpdate={updateCheckoutData}
              />
            </Elements>
          </LoadingOverlay>
        )
      case 'review':
        return (
          <LoadingOverlay isLoading={isStepLoading} message="Preparing order review...">
            <ReviewStep
              cartData={cartData}
              checkoutData={checkoutData}
              onUpdate={updateCheckoutData}
              onPlaceOrder={handlePlaceOrder}
              onEditStep={handleEditStep}
              isProcessing={isProcessing}
            />
            {isProcessing && (
              <div className="mt-6">
                <ProgressIndicator 
                  steps={[
                    'Creating order...',
                    'Processing payment...',
                    'Finalizing order...'
                  ]}
                  currentStep={processingStep}
                />
              </div>
            )}
          </LoadingOverlay>
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
      {(error || stepError) && (
        <div className="mb-6">
          <ErrorState
            title="Checkout Error"
            message={error || stepError || 'An unexpected error occurred'}
            onRetry={() => {
              setError(null)
              clearError()
              // Retry the current step
              if (currentStep === 'review' && isProcessing) {
                handlePlaceOrder()
              }
            }}
            onDismiss={() => {
              setError(null)
              clearError()
            }}
          />
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