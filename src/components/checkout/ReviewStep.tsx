"use client"

import { MapPin, CreditCard, Clock, Star, Edit, Truck, Home } from 'lucide-react'

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

interface CheckoutData {
  deliveryType: 'delivery' | 'pickup'
  selectedAddress?: any
  newAddress?: any
  selectedPayment?: any
  newPayment?: any
  deliveryTime: 'asap' | 'scheduled'
  scheduledTime?: Date
  specialInstructions: string
  tip: number
  useRewards: boolean
  rewardsPoints: number
  couponCode?: string
}

interface ReviewStepProps {
  cartData: CartData
  checkoutData: CheckoutData
  onUpdate: (updates: Partial<CheckoutData>) => void
  onPlaceOrder: () => void
  isProcessing: boolean
}

export default function ReviewStep({ 
  cartData, 
  checkoutData, 
  onUpdate, 
  onPlaceOrder, 
  isProcessing 
}: ReviewStepProps) {
  const rewardsDiscount = checkoutData.useRewards ? (checkoutData.rewardsPoints * 0.01) : 0
  const finalTotal = cartData.total + checkoutData.tip - rewardsDiscount
  const couponApplied = Boolean(checkoutData.couponCode)
  
  const getDeliveryAddress = () => {
    if (checkoutData.selectedAddress) {
      return `${checkoutData.selectedAddress.street}, ${checkoutData.selectedAddress.city}, ${checkoutData.selectedAddress.state} ${checkoutData.selectedAddress.zipCode}`
    }
    if (checkoutData.newAddress) {
      return `${checkoutData.newAddress.street}, ${checkoutData.newAddress.city}, ${checkoutData.newAddress.state} ${checkoutData.newAddress.zipCode}`
    }
    return 'No address selected'
  }
  
  const getPaymentMethod = () => {
    if (checkoutData.selectedPayment) {
      return `${checkoutData.selectedPayment.brand.toUpperCase()} •••• ${checkoutData.selectedPayment.last4}`
    }
    if (checkoutData.newPayment) {
      return 'New payment method'
    }
    return 'No payment method selected'
  }
  
  const getEstimatedTime = () => {
    if (checkoutData.deliveryTime === 'scheduled' && checkoutData.scheduledTime) {
      return checkoutData.scheduledTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    
    const baseTime = checkoutData.deliveryType === 'delivery' ? 35 : 20
    const estimatedTime = new Date(Date.now() + baseTime * 60 * 1000)
    return `ASAP (${estimatedTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })})`
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Review Your Order</h2>
        <p className="text-gray-400">Please review all details before placing your order</p>
      </div>
      
      {/* Order Items */}
      <div className="bg-black/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Order Items</h3>
        <div className="space-y-4">
          {cartData.items.map((item) => (
            <div key={item.id} className="flex items-start space-x-4 pb-4 border-b border-gray-700 last:border-b-0 last:pb-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium">{item.name}</h4>
                    <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                    
                    {item.customizations.length > 0 && (
                      <div className="mt-2">
                        {item.customizations.map((customization, index) => (
                          <span key={index} className="inline-block text-xs text-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10 px-2 py-1 rounded mr-2 mb-1">
                            + {customization}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Delivery Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              {checkoutData.deliveryType === 'delivery' ? (
                <Truck className="w-5 h-5 mr-2 text-[var(--color-harvest-gold)]" />
              ) : (
                <Home className="w-5 h-5 mr-2 text-[var(--color-harvest-gold)]" />
              )}
              {checkoutData.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}
            </h3>
            <button className="text-[var(--color-harvest-gold)] hover:text-[var(--color-harvest-gold)]/80 text-sm font-medium">
              <Edit className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {checkoutData.deliveryType === 'delivery' && (
              <div>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-white font-medium">Delivery Address</div>
                    <div className="text-gray-400 text-sm">{getDeliveryAddress()}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <div className="flex items-start">
                <Clock className="w-4 h-4 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-white font-medium">Estimated Time</div>
                  <div className="text-gray-400 text-sm">{getEstimatedTime()}</div>
                </div>
              </div>
            </div>
            
            {checkoutData.specialInstructions && (
              <div>
                <div className="text-white font-medium mb-1">Special Instructions</div>
                <div className="text-gray-400 text-sm bg-gray-800 p-3 rounded">
                  {checkoutData.specialInstructions}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Payment Information */}
        <div className="bg-black/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-[var(--color-harvest-gold)]" />
              Payment
            </h3>
            <button className="text-[var(--color-harvest-gold)] hover:text-[var(--color-harvest-gold)]/80 text-sm font-medium">
              <Edit className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-white font-medium mb-1">Payment Method</div>
              <div className="text-gray-400 text-sm">{getPaymentMethod()}</div>
            </div>
            
            {checkoutData.tip > 0 && (
              <div>
                <div className="text-white font-medium mb-1">Tip</div>
                <div className="text-gray-400 text-sm">${checkoutData.tip.toFixed(2)}</div>
              </div>
            )}
            
            {checkoutData.useRewards && (
              <div>
                <div className="text-white font-medium mb-1 flex items-center">
                  <Star className="w-4 h-4 mr-1 text-[var(--color-harvest-gold)]" />
                  Rewards Applied
                </div>
                <div className="text-green-400 text-sm">
                  {checkoutData.rewardsPoints.toLocaleString()} points (-${rewardsDiscount.toFixed(2)})
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Order Summary */}
      <div className="bg-black/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-gray-300">
            <span>Subtotal ({cartData.items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
            <span>${cartData.subtotal.toFixed(2)}</span>
          </div>
          
          {checkoutData.deliveryType === 'delivery' && (
            <div className="flex items-center justify-between text-gray-300">
              <span>Delivery Fee</span>
              <span>${cartData.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-gray-300">
            <span>Tax</span>
            <span>${cartData.tax.toFixed(2)}</span>
          </div>
          
          {checkoutData.tip > 0 && (
            <div className="flex items-center justify-between text-gray-300">
              <span>Tip</span>
              <span>${checkoutData.tip.toFixed(2)}</span>
            </div>
          )}
          
          {checkoutData.useRewards && rewardsDiscount > 0 && (
            <div className="flex items-center justify-between text-green-400">
              <span className="flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Rewards Discount
              </span>
              <span>-${rewardsDiscount.toFixed(2)}</span>
            </div>
          )}

          {couponApplied && (
            <div className="flex items-center justify-between text-[var(--color-harvest-gold)]">
              <span>Coupon</span>
              <span>{checkoutData.couponCode}</span>
            </div>
          )}
          
          <div className="border-t border-gray-600 pt-3">
            <div className="flex items-center justify-between text-white text-xl font-bold">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Terms and Place Order */}
      <div className="space-y-4">
        <div className="text-sm text-gray-400">
          <p>
            By placing this order, you agree to our{' '}
            <a href="/terms" className="text-[var(--color-harvest-gold)] hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-[var(--color-harvest-gold)] hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
        
        <button
          onClick={onPlaceOrder}
          disabled={isProcessing}
          className="
            w-full py-4 px-6 bg-[var(--color-harvest-gold)] text-black text-lg font-bold rounded-lg
            hover:bg-[var(--color-harvest-gold)]/90 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center
          "
        >
          {isProcessing ? (
            <>
              <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin mr-3" />
              Processing Your Order...
            </>
          ) : (
            <>
              Place Order • ${finalTotal.toFixed(2)}
            </>
          )}
        </button>
        
        {!isProcessing && (
          <div className="text-center text-sm text-gray-400">
            <p>Your payment will be processed securely</p>
          </div>
        )}
      </div>
    </div>
  )
}