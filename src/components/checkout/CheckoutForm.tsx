"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '../../lib/context/CartContext'
import { useOrder } from '../../lib/context/OrderContext'
import { useAuth } from '../../lib/context/AuthContext'
import { OrderFormData } from '../../types/order'
import { toast } from '../../components/ui/use-toast'
import { FaCreditCard, FaLock, FaMapMarkerAlt, FaClock, FaPhone, FaEnvelope } from 'react-icons/fa'
import StripePaymentForm from './StripePaymentForm'
import CouponValidation from './CouponValidation'
import type { Coupon } from '../../lib/services/couponService'

interface CheckoutFormProps {
  onOrderComplete: (orderId: string) => void
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onOrderComplete }) => {
  const router = useRouter()
  const { items, subtotal, tax, total, clearCart } = useCart()
  const { createOrder, isLoading } = useOrder()
  const { user } = useAuth()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<OrderFormData>({
    email: user?.email || '',
    phone: '',
    orderType: 'delivery',
    deliveryTime: 'asap',
    paymentMethod: 'card'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  // Pickup locations
  const pickupLocations = [
    { id: 'downtown', name: 'Downtown Location', address: '123 Main St, Downtown' },
    { id: 'midtown', name: 'Midtown Location', address: '456 Oak Ave, Midtown' },
    { id: 'uptown', name: 'Uptown Location', address: '789 Pine St, Uptown' }
  ]

  // Form validation
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNumber === 1) {
      if (!formData.email) newErrors.email = 'Email is required'
      if (!formData.phone) newErrors.phone = 'Phone number is required'
      if (formData.orderType === 'delivery' && !formData.deliveryAddress?.street) {
        newErrors.address = 'Delivery address is required'
      }
      if (formData.orderType === 'pickup' && !formData.pickupLocation) {
        newErrors.pickupLocation = 'Pickup location is required'
      }
    }

    if (stepNumber === 2) {
      if (formData.paymentMethod === 'card') {
        if (!formData.paymentInfo?.cardNumber) newErrors.cardNumber = 'Card number is required'
        if (!formData.paymentInfo?.cardName) newErrors.cardName = 'Cardholder name is required'
        if (!formData.paymentInfo?.expiryDate) newErrors.expiryDate = 'Expiry date is required'
        if (!formData.paymentInfo?.cvv) newErrors.cvv = 'CVV is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Calculate final total with coupon discount
  const calculateFinalTotal = () => {
    const deliveryFee = formData.orderType === 'delivery' && subtotal < 50 ? 4.99 : 0
    const baseTotal = subtotal + tax + deliveryFee
    return Math.max(0, baseTotal - discountAmount)
  }

  // Handle coupon application
  const handleCouponApplied = (coupon: Coupon) => {
    setAppliedCoupon(coupon)
    // For now, we'll apply a simple discount based on reward type
    // This could be enhanced to support different discount types
    const discount = calculateCouponDiscount(coupon)
    setDiscountAmount(discount)
  }

  // Handle coupon removal
  const handleCouponRemoved = () => {
    setAppliedCoupon(null)
    setDiscountAmount(0)
  }

  // Calculate discount amount based on coupon
  const calculateCouponDiscount = (coupon: Coupon): number => {
    // This is a simple implementation - you can enhance this based on your reward types
    const rewardName = coupon.rewardName.toLowerCase()
    
    if (rewardName.includes('10% off')) {
      return subtotal * 0.1
    } else if (rewardName.includes('$5 off')) {
      return 5
    } else if (rewardName.includes('$10 off')) {
      return 10
    } else if (rewardName.includes('free delivery')) {
      return formData.orderType === 'delivery' && subtotal < 50 ? 4.99 : 0
    }
    
    // Default discount for other rewards
    return 5
  }

  // Handle form submission
  const handleSubmit = async (paymentIntentId?: string) => {
    if (!validateStep(2)) return

    try {
      const finalTotal = calculateFinalTotal()
      
      const orderData = {
        userId: user?.id,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          customizations: item.customizations
        })),
        subtotal,
        tax,
        deliveryFee: formData.orderType === 'delivery' && subtotal < 50 ? 4.99 : 0,
        discountAmount,
        total: finalTotal,
        status: 'pending' as const,
        orderType: formData.orderType,
        deliveryAddress: formData.deliveryAddress,
        pickupLocation: formData.pickupLocation,
        contactInfo: {
          email: formData.email,
          phone: formData.phone
        },
        paymentInfo: {
          ...formData.paymentInfo,
          stripePaymentIntentId: paymentIntentId
        },
        appliedCoupon: appliedCoupon ? {
          id: appliedCoupon.id,
          code: appliedCoupon.code,
          rewardName: appliedCoupon.rewardName,
          discountAmount
        } : undefined,
        specialInstructions: formData.specialInstructions,
        estimatedTime: formData.deliveryTime === 'scheduled' ? formData.scheduledTime : undefined
      }

      // Create the order
      const orderId = await createOrder(orderData)
      
      // Mark coupon as used if one was applied
      if (appliedCoupon && orderId) {
        try {
          const { useCoupon } = await import('../../lib/services/couponService')
          await useCoupon(appliedCoupon.code, orderId)
        } catch (error) {
          console.error('Failed to mark coupon as used:', error)
          // Don't fail the order if coupon marking fails
        }
      }
      
      clearCart()
      onOrderComplete(orderId)
    } catch (error) {
      console.error('Order creation failed:', error)
    }
  }

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Update nested form data
  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof OrderFormData],
        [field]: value
      }
    }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 1 ? 'bg-gold-foil text-black' : 'bg-gray-600 text-white'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${
            step >= 2 ? 'bg-gold-foil' : 'bg-gray-600'
          }`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 2 ? 'bg-gold-foil text-black' : 'bg-gray-600 text-white'
          }`}>
            2
          </div>
          <div className={`w-16 h-1 ${
            step >= 3 ? 'bg-gold-foil' : 'bg-gray-600'
          }`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 3 ? 'bg-gold-foil text-black' : 'bg-gray-600 text-white'
          }`}>
            3
          </div>
        </div>
      </div>

      {/* Step 1: Contact & Delivery Info */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-6">Contact & Delivery Information</h2>
          
          {/* Contact Info */}
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FaEnvelope className="mr-2 text-gold-foil" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
                  placeholder="(555) 123-4567"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
            <h3 className="text-lg font-semibold mb-4">Order Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateFormData('orderType', 'delivery')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.orderType === 'delivery'
                    ? 'border-gold-foil bg-gold-foil bg-opacity-10'
                    : 'border-[#333333] hover:border-[#555555]'
                }`}
              >
                <FaMapMarkerAlt className="mx-auto mb-2 text-xl" />
                <div className="font-medium">Delivery</div>
                <div className="text-sm text-gray-400">30-45 min</div>
              </button>
              <button
                type="button"
                onClick={() => updateFormData('orderType', 'pickup')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.orderType === 'pickup'
                    ? 'border-gold-foil bg-gold-foil bg-opacity-10'
                    : 'border-[#333333] hover:border-[#555555]'
                }`}
              >
                <FaClock className="mx-auto mb-2 text-xl" />
                <div className="font-medium">Pickup</div>
                <div className="text-sm text-gray-400">15-20 min</div>
              </button>
            </div>
          </div>

          {/* Delivery Address */}
          {formData.orderType === 'delivery' && (
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
              <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.deliveryAddress?.firstName || ''}
                      onChange={(e) => updateNestedFormData('deliveryAddress', 'firstName', e.target.value)}
                      className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.deliveryAddress?.lastName || ''}
                      onChange={(e) => updateNestedFormData('deliveryAddress', 'lastName', e.target.value)}
                      className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Street Address *</label>
                  <input
                    type="text"
                    value={formData.deliveryAddress?.street || ''}
                    onChange={(e) => updateNestedFormData('deliveryAddress', 'street', e.target.value)}
                    className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
                    placeholder="123 Main Street"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City *</label>
                    <input
                      type="text"
                      value={formData.deliveryAddress?.city || ''}
                      onChange={(e) => updateNestedFormData('deliveryAddress', 'city', e.target.value)}
                      className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">State *</label>
                    <input
                      type="text"
                      value={formData.deliveryAddress?.state || ''}
                      onChange={(e) => updateNestedFormData('deliveryAddress', 'state', e.target.value)}
                      className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                    <input
                      type="text"
                      value={formData.deliveryAddress?.zipCode || ''}
                      onChange={(e) => updateNestedFormData('deliveryAddress', 'zipCode', e.target.value)}
                      className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Delivery Instructions</label>
                  <textarea
                    value={formData.deliveryAddress?.deliveryInstructions || ''}
                    onChange={(e) => updateNestedFormData('deliveryAddress', 'deliveryInstructions', e.target.value)}
                    className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
                    rows={3}
                    placeholder="Leave at door, ring bell, etc."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pickup Location */}
          {formData.orderType === 'pickup' && (
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
              <h3 className="text-lg font-semibold mb-4">Pickup Location</h3>
              <div className="space-y-3">
                {pickupLocations.map((location) => (
                  <label key={location.id} className="flex items-center p-3 border border-[#333333] rounded-lg cursor-pointer hover:border-[#555555] transition-colors">
                    <input
                      type="radio"
                      name="pickupLocation"
                      value={location.id}
                      checked={formData.pickupLocation === location.id}
                      onChange={(e) => updateFormData('pickupLocation', e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-gray-400">{location.address}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.pickupLocation && <p className="text-red-500 text-sm mt-1">{errors.pickupLocation}</p>}
            </div>
          )}

          <button
            onClick={() => {
              if (validateStep(1)) setStep(2)
            }}
            className="w-full btn-primary"
          >
            Continue to Payment
          </button>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-6">Payment Information</h2>
          
          {/* Payment Method */}
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => updateFormData('paymentMethod', 'card')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.paymentMethod === 'card'
                    ? 'border-gold-foil bg-gold-foil bg-opacity-10'
                    : 'border-[#333333] hover:border-[#555555]'
                }`}
              >
                <FaCreditCard className="mx-auto mb-2 text-xl" />
                <div className="font-medium">Credit Card</div>
              </button>
              <button
                type="button"
                onClick={() => updateFormData('paymentMethod', 'cash')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.paymentMethod === 'cash'
                    ? 'border-gold-foil bg-gold-foil bg-opacity-10'
                    : 'border-[#333333] hover:border-[#555555]'
                }`}
              >
                <div className="mx-auto mb-2 text-xl">💵</div>
                <div className="font-medium">Cash {formData.orderType === 'delivery' ? 'on Delivery' : 'on Pickup'}</div>
              </button>
            </div>
          </div>

          // In the CheckoutForm component, replace the credit card form section with:

          {/* Coupon Validation */}
          <CouponValidation
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
            appliedCoupon={appliedCoupon}
            disabled={isLoading}
          />

          {/* Credit Card Form - Replace with Stripe */}
          {formData.paymentMethod === 'card' && (
          <StripePaymentForm
            amount={calculateFinalTotal()}
            onPaymentSuccess={(paymentIntentId) => {
              // Update form data with payment info
              updateNestedFormData('paymentInfo', 'stripePaymentIntentId', paymentIntentId)
              // Proceed to create order
              handleSubmit(paymentIntentId)
            }}
            onPaymentError={(error) => {
              toast({
                title: 'Payment Error',
                description: error,
                variant: 'destructive',
              })
            }}
            disabled={isLoading}
            orderMetadata={{
              email: formData.email,
              phone: formData.phone,
              orderType: formData.orderType
            }}
          />
          )}

          {/* Special Instructions */}
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
            <h3 className="text-lg font-semibold mb-4">Special Instructions</h3>
            <textarea
              value={formData.specialInstructions || ''}
              onChange={(e) => updateFormData('specialInstructions', e.target.value)}
              className="w-full p-3 bg-[#111111] border border-[#333333] rounded-lg focus:border-gold-foil focus:outline-none"
              rows={3}
              placeholder="Any special requests or dietary restrictions..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 btn-outline"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (validateStep(2)) setStep(3)
              }}
              className="flex-1 btn-primary"
            >
              Review Order
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>
          
          {/* Order Summary */}
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-400 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="text-gold-foil">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-[#333333] pt-3 mt-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {formData.orderType === 'delivery' && subtotal < 50 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>$4.99</span>
                  </div>
                )}
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount ({appliedCoupon.code}):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-[#333333] pt-2 mt-2">
                  <span>Total:</span>
                  <span className="text-gold-foil">${calculateFinalTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Delivery Info Summary */}
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333333]">
            <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
            <div className="space-y-2">
              <p><strong>Contact:</strong> {formData.email} | {formData.phone}</p>
              <p><strong>Order Type:</strong> {formData.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</p>
              {formData.orderType === 'delivery' && formData.deliveryAddress && (
                <p><strong>Address:</strong> {formData.deliveryAddress.street}, {formData.deliveryAddress.city}, {formData.deliveryAddress.state} {formData.deliveryAddress.zipCode}</p>
              )}
              {formData.orderType === 'pickup' && formData.pickupLocation && (
                <p><strong>Pickup Location:</strong> {pickupLocations.find(l => l.id === formData.pickupLocation)?.name}</p>
              )}
              <p><strong>Payment:</strong> {formData.paymentMethod === 'card' ? 'Credit Card' : `Cash on ${formData.orderType === 'delivery' ? 'Delivery' : 'Pickup'}`}</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 btn-outline"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutForm