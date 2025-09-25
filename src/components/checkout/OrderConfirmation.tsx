"use client"

import { CheckCircle, Clock, MapPin, Truck, Star, Download, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import RealTimeOrderStatus from '@/components/orders/RealTimeOrderStatus'
import { useState } from 'react'

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
  deliveryTime: 'asap' | 'scheduled'
  scheduledTime?: Date
  tip: number
  useRewards: boolean
  rewardsPoints: number
}

interface OrderConfirmationProps {
  orderId: string
  cartData: CartData
  checkoutData: CheckoutData
}

export default function OrderConfirmation({ 
  orderId, 
  cartData, 
  checkoutData 
}: OrderConfirmationProps) {
  const router = useRouter()
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const rewardsDiscount = checkoutData.useRewards ? (checkoutData.rewardsPoints * 0.01) : 0
  const finalTotal = cartData.total + checkoutData.tip - rewardsDiscount
  
  const getEstimatedDeliveryTime = () => {
    if (checkoutData.deliveryTime === 'scheduled' && checkoutData.scheduledTime) {
      return checkoutData.scheduledTime
    }
    
    const baseTime = checkoutData.deliveryType === 'delivery' ? 35 : 20
    return new Date(Date.now() + baseTime * 60 * 1000)
  }
  
  const estimatedTime = getEstimatedDeliveryTime()
  const pointsEarned = Math.floor(finalTotal * 10)
  
  const getDeliveryAddress = () => {
    if (checkoutData.selectedAddress) {
      return `${checkoutData.selectedAddress.street}, ${checkoutData.selectedAddress.city}, ${checkoutData.selectedAddress.state} ${checkoutData.selectedAddress.zipCode}`
    }
    if (checkoutData.newAddress) {
      return `${checkoutData.newAddress.street}, ${checkoutData.newAddress.city}, ${checkoutData.newAddress.state} ${checkoutData.newAddress.zipCode}`
    }
    return 'Pickup at restaurant'
  }
  
  return (
    <div className="min-h-screen bg-[var(--color-rich-black)] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gold-foil rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
          <p className="text-gray-400 text-lg">
            Thank you for your order. We&apos;re preparing your delicious meal!
          </p>
          
          <div className="mt-6 p-4 bg-[var(--color-dark-charcoal)] rounded-lg border border-[var(--color-harvest-gold)]/20 inline-block">
            <div className="text-sm text-gray-400 mb-1">Order Number</div>
            <div className="text-2xl font-bold text-[var(--color-harvest-gold)]">{orderId}</div>
          </div>
        </div>
        
        {/* Order Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20 text-center">
            <Clock className="w-8 h-8 text-[var(--color-harvest-gold)] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Estimated Time</h3>
            <p className="text-gray-400">
              {estimatedTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {checkoutData.deliveryTime === 'asap' ? 'ASAP' : 'Scheduled'}
            </p>
          </div>
          
          <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20 text-center">
            {checkoutData.deliveryType === 'delivery' ? (
              <Truck className="w-8 h-8 text-[var(--color-harvest-gold)] mx-auto mb-3" />
            ) : (
              <MapPin className="w-8 h-8 text-[var(--color-harvest-gold)] mx-auto mb-3" />
            )}
            <h3 className="text-lg font-semibold text-white mb-2">
              {checkoutData.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}
            </h3>
            <p className="text-gray-400 text-sm">{getDeliveryAddress()}</p>
          </div>
          
          <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20 text-center">
            <Star className="w-8 h-8 text-[var(--color-harvest-gold)] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Points Earned</h3>
            <p className="text-[var(--color-harvest-gold)] font-bold text-xl">
              +{pointsEarned.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">Broski Rewards</p>
          </div>
        </div>
        
        {/* Real-time Order Status */}
        <div className="mb-8">
          <RealTimeOrderStatus 
            orderId={orderId} 
            onOrderUpdate={(order) => setCurrentOrder(order)}
          />
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Items Ordered */}
          <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
            <h3 className="text-xl font-bold text-white mb-4">Items Ordered</h3>
            
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
          
          {/* Order Summary */}
          <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
            <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-gray-300">
                <span>Subtotal</span>
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
              
              <div className="border-t border-gray-600 pt-3">
                <div className="flex items-center justify-between text-white text-xl font-bold">
                  <span>Total Paid</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button className="flex items-center justify-center px-6 py-3 bg-[var(--color-harvest-gold)] text-black font-semibold rounded-lg hover:bg-[var(--color-harvest-gold)]/90 transition-colors">
            <Download className="w-5 h-5 mr-2" />
            Download Receipt
          </button>
          
          <button className="flex items-center justify-center px-6 py-3 bg-gold-foil text-black font-semibold rounded-lg hover:bg-harvest-gold transition-colors">
            <MessageCircle className="w-5 h-5 mr-2" />
            Track Order
          </button>
          
          <button 
            onClick={() => router.push('/menu')}
            className="flex items-center justify-center px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Order Again
          </button>
        </div>
        
        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gold-foil/20 border border-gold-foil/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-300 mb-3">What's Next?</h4>
            <ul className="space-y-2 text-blue-200/80 text-sm">
              <li>• We&apos;ll send you updates via SMS and email</li>
              <li>• You can track your order in real-time</li>
              <li>• Our chef is already preparing your meal</li>
              <li>• {checkoutData.deliveryType === 'delivery' ? 'Our driver will contact you when nearby' : 'We&apos;ll notify you when ready for pickup'}</li>
            </ul>
          </div>
          
          <div className="bg-[var(--color-harvest-gold)]/10 border border-[var(--color-harvest-gold)]/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-[var(--color-harvest-gold)] mb-3">Need Help?</h4>
            <div className="space-y-2 text-[var(--color-harvest-gold)]/80 text-sm">
              <p>• Call us: <a href="tel:+1234567890" className="underline">(123) 456-7890</a></p>
              <p>• Email: <a href="mailto:support@broskiskitchen.com" className="underline">support@broskiskitchen.com</a></p>
              <p>• Live chat available 24/7</p>
              <p>• Order ID: <span className="font-mono">{orderId}</span></p>
            </div>
          </div>
        </div>
        
        {/* Back to Home */}
        <div className="text-center mt-8">
          <button 
            onClick={() => router.push('/')}
            className="text-[var(--color-harvest-gold)] hover:text-[var(--color-harvest-gold)]/80 font-medium transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}