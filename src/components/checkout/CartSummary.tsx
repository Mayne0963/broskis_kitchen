"use client"

import { Star, Clock, Truck, MapPin } from 'lucide-react'

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

interface CheckoutData {
  deliveryType: 'delivery' | 'pickup'
  deliveryTime: 'asap' | 'scheduled'
  scheduledTime?: Date
  tip: number
  useRewards: boolean
  rewardsPoints: number
}

interface CartSummaryProps {
  cartData: CartData
  checkoutData: CheckoutData
}

export default function CartSummary({ cartData, checkoutData }: CartSummaryProps) {
  const getItemTotalPrice = (item: CartItem) => {
    let totalPrice = item.price
    
    if (item.customizations) {
      Object.values(item.customizations).flat().forEach(customization => {
        totalPrice += customization.price
      })
    }
    
    return totalPrice
  }
  
  const rewardsDiscount = checkoutData.useRewards ? (checkoutData.rewardsPoints * 0.01) : 0
  const finalTotal = cartData.total + checkoutData.tip - rewardsDiscount
  
  const getEstimatedTime = () => {
    if (checkoutData.deliveryTime === 'scheduled' && checkoutData.scheduledTime) {
      return checkoutData.scheduledTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    
    const baseTime = checkoutData.deliveryType === 'delivery' ? 35 : 20
    const estimatedTime = new Date(Date.now() + baseTime * 60 * 1000)
    return estimatedTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
  
  return (
    <div className="bg-[var(--color-dark-charcoal)] rounded-lg border border-[var(--color-harvest-gold)]/20 sticky top-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Star className="w-6 h-6 mr-2 text-[var(--color-harvest-gold)]" />
          Order Summary
        </h3>
        
        {/* Delivery Info */}
        <div className="mt-4 p-3 bg-black/30 rounded-lg">
          <div className="flex items-center text-sm">
            {checkoutData.deliveryType === 'delivery' ? (
              <Truck className="w-4 h-4 mr-2 text-[var(--color-harvest-gold)]" />
            ) : (
              <MapPin className="w-4 h-4 mr-2 text-[var(--color-harvest-gold)]" />
            )}
            <span className="text-white font-medium">
              {checkoutData.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}
            </span>
          </div>
          
          <div className="flex items-center text-sm mt-1">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-gray-300">
              {checkoutData.deliveryTime === 'asap' ? 'ASAP' : 'Scheduled'} • Est. {getEstimatedTime()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Items */}
      <div className="p-6 border-b border-gray-700 max-h-64 overflow-y-auto">
        <div className="space-y-4">
          {cartData.items.map((item) => (
            <div key={item.id} className="flex items-start space-x-3">
              <img
                src={item.image || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=delicious_food_item_restaurant_photography&image_size=square'}
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <div className="mt-1">
                        {Object.entries(item.customizations).map(([categoryId, customizations]) => (
                          <div key={categoryId}>
                            {categoryId === 'options' ? (
                              // Handle simple options
                              customizations.map((customization, index) => (
                                <span key={index} className="text-xs text-gray-400 block">
                                  {customization.name}
                                </span>
                              ))
                            ) : (
                              // Handle regular customizations
                              customizations.map((customization, index) => (
                                <span key={index} className="text-xs text-gray-400 block">
                                  + {customization.name} {customization.price > 0 && `(+$${customization.price.toFixed(2)})`}
                                </span>
                              ))
                            )}
                            {/* Display simple customization options */}
                            {customizations
                              ?.filter(option => option.name.includes(':'))
                              .map((option, index) => (
                                <span key={index} className="block text-xs text-gray-500">
                                  {option.name}
                                </span>
                              ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-2">
                    <div className="text-white font-semibold text-sm">
                      ${(getItemTotalPrice(item) * item.quantity).toFixed(2)}
                    </div>
                    <div className="text-gray-400 text-xs">
                      ${getItemTotalPrice(item).toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Pricing Breakdown */}
      <div className="p-6">
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
            <div className="flex items-center justify-between text-white text-lg font-bold">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Rewards Info */}
        {checkoutData.useRewards && (
          <div className="mt-4 p-3 bg-[var(--color-harvest-gold)]/10 border border-[var(--color-harvest-gold)]/30 rounded-lg">
            <div className="flex items-center text-sm">
              <Star className="w-4 h-4 mr-2 text-[var(--color-harvest-gold)]" />
              <span className="text-[var(--color-harvest-gold)] font-medium">
                Using {checkoutData.rewardsPoints.toLocaleString()} points
              </span>
            </div>
            <div className="text-xs text-[var(--color-harvest-gold)]/80 mt-1">
              You'll save ${rewardsDiscount.toFixed(2)} on this order
            </div>
          </div>
        )}
        
        {/* Earning Points */}
        <div className="mt-4 p-3 bg-gold-foil/20 border border-gold-foil/30 rounded-lg">
          <div className="flex items-center text-sm">
            <Star className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-blue-300 font-medium">
              You'll earn {Math.floor(finalTotal * 10)} points
            </span>
          </div>
          <div className="text-xs text-blue-200/80 mt-1">
            10 points per $1 spent
          </div>
        </div>
      </div>
    </div>
  )
}