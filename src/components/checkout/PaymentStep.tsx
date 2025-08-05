"use client"

import { useState } from 'react'
import { CreditCard, Star, Plus, DollarSign, Gift } from 'lucide-react'
import StripePaymentForm from './StripePaymentForm'

interface PaymentMethod {
  id: string
  type: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

interface CartData {
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
}

interface CheckoutData {
  selectedPayment?: PaymentMethod
  newPayment?: any
  tip: number
  useRewards: boolean
  rewardsPoints: number
}

interface PaymentStepProps {
  paymentMethods: PaymentMethod[]
  cartData: CartData
  checkoutData: CheckoutData
  onUpdate: (updates: Partial<CheckoutData>) => void
}

const tipOptions = [0, 0.15, 0.18, 0.20, 0.25]

export default function PaymentStep({ 
  paymentMethods, 
  cartData, 
  checkoutData, 
  onUpdate 
}: PaymentStepProps) {
  const [showNewCardForm, setShowNewCardForm] = useState(false)
  const [customTip, setCustomTip] = useState('')
  const [newCard, setNewCard] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    name: '',
    zipCode: ''
  })
  
  // Mock user rewards data - replace with actual API call
  const userRewards = {
    availablePoints: 1250,
    maxRedeemable: Math.min(1250, Math.floor(cartData.total * 100)) // Max 100% of order value
  }
  
  const handlePaymentSelect = (payment: PaymentMethod) => {
    onUpdate({ selectedPayment: payment, newPayment: undefined })
    setShowNewCardForm(false)
  }
  
  const handleTipSelect = (tipPercentage: number) => {
    const tipAmount = cartData.total * tipPercentage
    onUpdate({ tip: tipAmount })
    setCustomTip('')
  }
  
  const handleCustomTip = (value: string) => {
    setCustomTip(value)
    const tipAmount = parseFloat(value) || 0
    onUpdate({ tip: tipAmount })
  }
  
  const handleRewardsToggle = (useRewards: boolean) => {
    if (useRewards) {
      onUpdate({ 
        useRewards: true, 
        rewardsPoints: Math.min(userRewards.maxRedeemable, userRewards.availablePoints)
      })
    } else {
      onUpdate({ useRewards: false, rewardsPoints: 0 })
    }
  }
  
  const handleRewardsPointsChange = (points: number) => {
    const validPoints = Math.min(points, userRewards.maxRedeemable, userRewards.availablePoints)
    onUpdate({ rewardsPoints: validPoints })
  }
  
  const getCardIcon = (brand: string) => {
    // In a real app, you'd use actual card brand icons
    return <CreditCard className="w-6 h-6" />
  }
  
  const formatCardNumber = (number: string) => {
    return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
  }
  
  const isNewCardValid = () => {
    return newCard.number.length >= 16 && 
           newCard.expiryMonth && 
           newCard.expiryYear && 
           newCard.cvc.length >= 3 && 
           newCard.name.length > 0
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment & Rewards</h2>
        <p className="text-gray-400">Choose your payment method and apply rewards</p>
      </div>
      
      {/* Rewards Section */}
      <div className="bg-gradient-to-r from-[var(--color-harvest-gold)]/10 to-[var(--color-gold-rich)]/10 border border-[var(--color-harvest-gold)]/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Star className="w-6 h-6 text-[var(--color-harvest-gold)] mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-white">Broski Rewards</h3>
              <p className="text-gray-300 text-sm">
                You have {userRewards.availablePoints.toLocaleString()} points available
              </p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={checkoutData.useRewards}
              onChange={(e) => handleRewardsToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#FFD700] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-harvest-gold)]"></div>
          </label>
        </div>
        
        {checkoutData.useRewards && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#FFD700] mb-2">
                Points to use (1 point = $0.01)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max={userRewards.maxRedeemable}
                  value={checkoutData.rewardsPoints}
                  onChange={(e) => handleRewardsPointsChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-[#FFD700] rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-right min-w-[100px]">
                  <div className="text-[var(--color-harvest-gold)] font-bold">
                    {checkoutData.rewardsPoints.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#FFD700]">points</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-[#FFD700]">Discount Applied</span>
              <span className="text-green-400 font-semibold">
                -${(checkoutData.rewardsPoints * 0.01).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Payment Methods */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
        
        {/* Existing Payment Methods */}
        {paymentMethods.length > 0 && (
          <div className="space-y-3 mb-4">
            {paymentMethods.map((payment) => (
              <button
                key={payment.id}
                onClick={() => handlePaymentSelect(payment)}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all text-left
                  ${
                    checkoutData.selectedPayment?.id === payment.id
                      ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10'
                      : 'border-[#FFD700] hover:border-[#E6C200]'
                  }
                `}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    checkoutData.selectedPayment?.id === payment.id
                      ? 'bg-[var(--color-harvest-gold)] text-black'
                      : 'bg-[#FFD700] text-black'
                  }`}>
                    {getCardIcon(payment.brand)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-white font-medium capitalize">
                        {payment.brand} •••• {payment.last4}
                      </span>
                      {payment.isDefault && (
                        <span className="ml-2 px-2 py-1 bg-[var(--color-harvest-gold)] text-black text-xs font-medium rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[#FFD700] text-sm">
                      Expires {payment.expiryMonth.toString().padStart(2, '0')}/{payment.expiryYear}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Add New Payment Method */}
        <button
          onClick={() => setShowNewCardForm(!showNewCardForm)}
          className="w-full p-4 border-2 border-dashed border-[#FFD700] rounded-lg hover:border-[var(--color-harvest-gold)] transition-colors text-center"
        >
          <Plus className="w-6 h-6 mx-auto mb-2 text-[#FFD700]" />
          <span className="text-[#FFD700]">Add New Payment Method</span>
        </button>
        
        {/* Stripe Payment Form */}
        {showNewCardForm && (
          <div className="mt-4">
            <StripePaymentForm
              amount={cartData.total + checkoutData.tip - (checkoutData.useRewards ? checkoutData.rewardsPoints * 0.01 : 0)}
              onPaymentSuccess={(paymentIntentId) => {
                onUpdate({ 
                  newPayment: { 
                    type: 'stripe',
                    paymentIntentId,
                    amount: cartData.total + checkoutData.tip - (checkoutData.useRewards ? checkoutData.rewardsPoints * 0.01 : 0),
                    status: 'succeeded',
                    last4: '****' // Will be updated after payment
                  },
                  selectedPayment: undefined
                })
                setShowNewCardForm(false)
              }}
              onPaymentError={(error) => {
                console.error('Payment error:', error)
                // Clear the new payment form on error
                setShowNewCardForm(false)
                onUpdate({
                  selectedPayment: undefined,
                  newPayment: undefined
                })
                // TODO: Show error toast to user
              }}
              orderMetadata={{
                tip: checkoutData.tip.toString(),
                rewardsUsed: checkoutData.useRewards.toString(),
                rewardsPoints: checkoutData.rewardsPoints.toString(),
                subtotal: cartData.subtotal.toString(),
                tax: cartData.tax.toString(),
                deliveryFee: cartData.deliveryFee.toString()
              }}
            />
          </div>
        )}
      </div>
      
      {/* Tip Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Add Tip</h3>
        
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {tipOptions.map((tipPercentage) => {
            const tipAmount = cartData.total * tipPercentage
            const isSelected = Math.abs(checkoutData.tip - tipAmount) < 0.01
            
            return (
              <button
                key={tipPercentage}
                onClick={() => handleTipSelect(tipPercentage)}
                className={`
                  p-3 rounded-lg border-2 transition-all text-center
                  ${
                    isSelected
                      ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10 text-[var(--color-harvest-gold)]'
                      : 'border-[#FFD700] hover:border-[#E6C200] text-[#FFD700]'
                  }
                `}
              >
                <div className="font-semibold">
                  {tipPercentage === 0 ? 'No Tip' : `${(tipPercentage * 100).toFixed(0)}%`}
                </div>
                {tipPercentage > 0 && (
                  <div className="text-xs mt-1">${tipAmount.toFixed(2)}</div>
                )}
              </button>
            )
          })}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#FFD700] mb-2">Custom Tip Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#FFD700]" />
            <input
              type="number"
              value={customTip}
              onChange={(e) => handleCustomTip(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-10 pr-3 py-2 bg-[var(--color-dark-charcoal)] border border-[#FFD700] rounded-lg text-white placeholder-[#FFD700] focus:border-[var(--color-harvest-gold)] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}