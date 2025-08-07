"use client"

import { useState } from 'react'
import { CreditCard, Star, Plus, DollarSign, Gift, Loader2, Smartphone } from 'lucide-react'
import StripePaymentForm from './StripePaymentForm'
import PaymentRequestButton from './PaymentRequestButton'
import CashAppPayment from './CashAppPayment'

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
  paymentType?: 'card' | 'digital_wallet' | 'cashapp'
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
  const [showDigitalWallets, setShowDigitalWallets] = useState(false)
  const [showCashApp, setShowCashApp] = useState(false)
  const [customTip, setCustomTip] = useState('')
  const [isLoadingRewards, setIsLoadingRewards] = useState(false)
  const [rewardsError, setRewardsError] = useState<string | null>(null)
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
    maxRedeemable: Math.min(1250, Math.floor((cartData.total + checkoutData.tip) * 100)) // Max 100% of order value including tip
  }
  
  const handlePaymentSelect = (payment: PaymentMethod) => {
    onUpdate({ selectedPayment: payment, newPayment: undefined, paymentType: 'card' })
    setShowNewCardForm(false)
    setShowDigitalWallets(false)
    setShowCashApp(false)
  }
  
  const handleDigitalWalletPayment = (paymentMethodId: string, paymentDetails: any) => {
    const finalAmount = calculateFinalAmount()
    onUpdate({ 
      newPayment: { 
        type: 'digital_wallet',
        paymentMethodId,
        paymentDetails,
        amount: finalAmount,
        status: 'succeeded'
      },
      selectedPayment: undefined,
      paymentType: 'digital_wallet'
    })
    setShowDigitalWallets(false)
  }
  
  const handleCashAppPayment = (paymentMethodId: string, paymentDetails: any) => {
    const finalAmount = calculateFinalAmount()
    onUpdate({ 
      newPayment: { 
        type: 'cashapp',
        paymentMethodId,
        paymentDetails,
        amount: finalAmount,
        status: 'succeeded'
      },
      selectedPayment: undefined,
      paymentType: 'cashapp'
    })
    setShowCashApp(false)
  }
  
  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    // Reset payment state on error
    onUpdate({
      selectedPayment: undefined,
      newPayment: undefined,
      paymentType: undefined
    })
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
  
  const handleRewardsToggle = async (useRewards: boolean) => {
    if (useRewards) {
      setIsLoadingRewards(true)
      setRewardsError(null)
      
      try {
        // Simulate API call to validate rewards
        await new Promise(resolve => setTimeout(resolve, 800))
        
        onUpdate({ 
          useRewards: true, 
          rewardsPoints: Math.min(userRewards.maxRedeemable, userRewards.availablePoints)
        })
      } catch (error) {
        setRewardsError('Failed to apply rewards. Please try again.')
        onUpdate({ useRewards: false, rewardsPoints: 0 })
      } finally {
        setIsLoadingRewards(false)
      }
    } else {
      onUpdate({ useRewards: false, rewardsPoints: 0 })
      setRewardsError(null)
    }
  }
  
  const handleRewardsPointsChange = (points: number) => {
    const validPoints = Math.min(points, userRewards.maxRedeemable, userRewards.availablePoints)
    onUpdate({ rewardsPoints: validPoints })
  }
  
  const calculateFinalAmount = () => {
    const baseAmount = cartData.total + checkoutData.tip
    const rewardsDiscount = checkoutData.useRewards ? checkoutData.rewardsPoints * 0.01 : 0
    return Math.max(0, baseAmount - rewardsDiscount)
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
          
          <div className="flex items-center space-x-2">
            {isLoadingRewards && (
              <Loader2 className="w-4 h-4 text-[var(--color-harvest-gold)] animate-spin" />
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={checkoutData.useRewards}
                onChange={(e) => handleRewardsToggle(e.target.checked)}
                disabled={isLoadingRewards}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#FFD700] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-harvest-gold)] peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
        
        {rewardsError && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{rewardsError}</p>
          </div>
        )}
        
        {checkoutData.useRewards && !isLoadingRewards && (
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
                  aria-label="Rewards points to use"
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
            
            <div className="flex items-center justify-between p-3 bg-[var(--color-harvest-gold)]/10 rounded-lg border border-[var(--color-harvest-gold)]/30">
              <span className="text-white font-medium">Final Amount</span>
              <span className="text-[var(--color-harvest-gold)] font-bold text-lg">
                ${calculateFinalAmount().toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Payment Methods */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-6">Payment Method</h3>
        
        {/* Digital Wallets (Apple Pay, Google Pay) */}
        <div className="mb-6">
          <PaymentRequestButton
            amount={calculateFinalAmount()}
            onPaymentSuccess={handleDigitalWalletPayment}
            onPaymentError={handlePaymentError}
            orderMetadata={{
              tip: checkoutData.tip.toFixed(2),
              rewardsUsed: checkoutData.useRewards.toString(),
              rewardsPoints: checkoutData.rewardsPoints.toString(),
              rewardsDiscount: (checkoutData.useRewards ? checkoutData.rewardsPoints * 0.01 : 0).toFixed(2),
              subtotal: cartData.subtotal.toFixed(2),
              tax: cartData.tax.toFixed(2),
              deliveryFee: cartData.deliveryFee.toFixed(2),
              originalTotal: cartData.total.toFixed(2)
            }}
          />
        </div>
        
        {/* CashApp Payment */}
        <div className="mb-6">
          <CashAppPayment
            amount={calculateFinalAmount()}
            onPaymentSuccess={handleCashAppPayment}
            onPaymentError={handlePaymentError}
            orderMetadata={{
              tip: checkoutData.tip.toFixed(2),
              rewardsUsed: checkoutData.useRewards.toString(),
              rewardsPoints: checkoutData.rewardsPoints.toString(),
              rewardsDiscount: (checkoutData.useRewards ? checkoutData.rewardsPoints * 0.01 : 0).toFixed(2),
              subtotal: cartData.subtotal.toFixed(2),
              tax: cartData.tax.toFixed(2),
              deliveryFee: cartData.deliveryFee.toFixed(2),
              originalTotal: cartData.total.toFixed(2)
            }}
          />
        </div>
        
        {/* Existing Payment Methods */}
        {paymentMethods.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <CreditCard className="w-5 h-5 text-[var(--color-harvest-gold)]" />
              <span className="text-white font-medium">Saved Cards</span>
            </div>
            {paymentMethods.map((payment) => (
              <button
                key={payment.id}
                onClick={() => handlePaymentSelect(payment)}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all text-left
                  ${
                    checkoutData.selectedPayment?.id === payment.id
                      ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10'
                      : 'border-gray-600 hover:border-[var(--color-harvest-gold)]'
                  }
                `}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-2 sm:mr-3 ${
                    checkoutData.selectedPayment?.id === payment.id
                      ? 'bg-[var(--color-harvest-gold)] text-black'
                      : 'bg-gray-700 text-white'
                  }`}>
                    {getCardIcon(payment.brand)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center mb-1">
                      <span className="text-white font-medium capitalize text-sm sm:text-base">
                        {payment.brand} •••• {payment.last4}
                      </span>
                      {payment.isDefault && (
                        <span className="mt-1 sm:mt-0 sm:ml-2 px-2 py-1 bg-[var(--color-harvest-gold)] text-black text-xs font-medium rounded self-start">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Expires {payment.expiryMonth.toString().padStart(2, '0')}/{payment.expiryYear}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Add New Card */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Plus className="w-5 h-5 text-[var(--color-harvest-gold)]" />
            <span className="text-white font-medium">Add New Card</span>
          </div>
          
          <button
            onClick={() => {
              setShowNewCardForm(!showNewCardForm)
              if (!showNewCardForm) {
                setShowDigitalWallets(false)
                setShowCashApp(false)
              }
            }}
            className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-[var(--color-harvest-gold)] transition-colors text-center bg-[var(--color-dark-charcoal)]"
          >
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <span className="text-gray-300">Add Debit/Credit Card</span>
          </button>
          
          {/* Stripe Payment Form */}
          {showNewCardForm && (
            <div className="mt-4">
              <StripePaymentForm
                amount={calculateFinalAmount()}
                onPaymentSuccess={(paymentIntentId) => {
                  const finalAmount = calculateFinalAmount()
                  onUpdate({ 
                    newPayment: { 
                      type: 'stripe',
                      paymentIntentId,
                      amount: finalAmount,
                      status: 'succeeded',
                      last4: '****' // Will be updated after payment
                    },
                    selectedPayment: undefined,
                    paymentType: 'card'
                  })
                  setShowNewCardForm(false)
                }}
                onPaymentError={handlePaymentError}
                orderMetadata={{
                  tip: checkoutData.tip.toFixed(2),
                  rewardsUsed: checkoutData.useRewards.toString(),
                  rewardsPoints: checkoutData.rewardsPoints.toString(),
                  rewardsDiscount: (checkoutData.useRewards ? checkoutData.rewardsPoints * 0.01 : 0).toFixed(2),
                  subtotal: cartData.subtotal.toFixed(2),
                  tax: cartData.tax.toFixed(2),
                  deliveryFee: cartData.deliveryFee.toFixed(2),
                  originalTotal: cartData.total.toFixed(2)
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Tip Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Add Tip</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4">
          {tipOptions.map((tipPercentage) => {
            const tipAmount = cartData.total * tipPercentage
            const isSelected = Math.abs(checkoutData.tip - tipAmount) < 0.01
            
            return (
              <button
                key={tipPercentage}
                onClick={() => handleTipSelect(tipPercentage)}
                className={`
                  p-2 sm:p-3 rounded-lg border-2 transition-all text-center
                  ${
                    isSelected
                      ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)]/10 text-[var(--color-harvest-gold)]'
                      : 'border-[#FFD700] hover:border-[#E6C200] text-[#FFD700]'
                  }
                `}
              >
                <div className="text-sm sm:text-base font-semibold">
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