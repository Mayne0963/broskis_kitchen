"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '../../lib/context/CartContext'
import { useOrders } from '../../lib/context/OrderContext'
import { useAuth } from '../../lib/context/AuthContext'
import { useRewards } from '../../lib/context/RewardsContext'
import { OrderFormData, DeliveryAddress, PaymentInfo } from '../../types/order'
import { FaCreditCard, FaLock, FaMapMarkerAlt, FaClock, FaPhone, FaEnvelope } from 'react-icons/fa'
import StripePaymentForm from './StripePaymentForm'

interface CheckoutFormProps {
  onOrderComplete: (orderId: string) => void
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onOrderComplete }) => {
  const router = useRouter()
  const { items, subtotal, tax, total, clearCart } = useCart()
  // const { createOrder, isLoading } = useOrders() // TODO: Implement order creation API
  const isLoading = false
  const { user } = useAuth()
  const { points } = useRewards()
  
  // Check if user has premium status (Gold tier = 1000+ points)
  const isPremiumUser = points >= 1000
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<OrderFormData>({
    email: user?.email || '',
    phone: '',
    orderType: 'delivery',
    deliveryTime: 'asap',
    paymentMethod: 'card'
  })
  // Lunch Drop (optional)
  const [workplaceName, setWorkplaceName] = useState<string>('')
  const [workplaceShift, setWorkplaceShift] = useState<string>('')
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset payment method to card if non-premium user has cash selected
  useEffect(() => {
    if (!isPremiumUser && formData.paymentMethod === 'cash') {
      setFormData(prev => ({ ...prev, paymentMethod: 'card' }))
    }
  }, [isPremiumUser, formData.paymentMethod])

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

  // Handle form submission
  const handleSubmit = async (paymentIntentId?: string) => {
    if (!validateStep(2)) return

    try {
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
        deliveryFee: 0, // Will be calculated in context
        total: 0, // Will be calculated in context
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
        specialInstructions: formData.specialInstructions,
        estimatedTime: formData.deliveryTime === 'scheduled' ? formData.scheduledTime : undefined,
        // Lunch Drop (optional)
        workplaceName: workplaceName || null,
        workplaceShift: workplaceShift || null,
      }

      // TODO: Implement order creation via API
      // const orderId = await createOrder(orderData)
      
      clearCart()
      // onOrderComplete(orderId)
      console.log('Order data prepared:', orderData)
      // Temporary: redirect to success page
      router.push('/checkout/success')
    } catch (error) {
      console.error('Order creation failed:', error)
    }
  }

  // Update form data
  const updateFormData = (field: keyof OrderFormData, value: string | DeliveryAddress | PaymentInfo) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }))
    }
  }

  // Update nested form data
  const updateNestedFormData = (parent: keyof OrderFormData, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
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
                {errors.email && <p className="text-[var(--color-harvest-gold)] text-sm mt-1">{errors.email}</p>}
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
                {errors.phone && <p className="text-[var(--color-harvest-gold)] text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Lunch Drop: Workplace & Shift (optional) */}
          <div className="checkout-lunchdrop-block">
            <h3 className="checkout-lunchdrop-title">Lunch Drop Details (Optional)</h3>
            <p className="checkout-lunchdrop-sub">
              If you&apos;re ordering with your job for Broski&apos;s Lunch Drop, enter your workplace and shift.
            </p>

            <div className="checkout-lunchdrop-row">
              <div className="checkout-lunchdrop-field">
                <label htmlFor="workplaceName">Workplace Name</label>
                <input
                  type="text"
                  id="workplaceName"
                  name="workplaceName"
                  placeholder="Example: General Motors – Body Shop"
                  value={workplaceName}
                  onChange={(e) => setWorkplaceName(e.target.value)}
                />
              </div>

              <div className="checkout-lunchdrop-field">
                <label htmlFor="workplaceShift">Shift</label>
                <select
                  id="workplaceShift"
                  name="workplaceShift"
                  value={workplaceShift}
                  onChange={(e) => setWorkplaceShift(e.target.value)}
                >
                  <option value="">Select shift (optional)</option>
                  <option value="1st">1st Shift</option>
                  <option value="2nd">2nd Shift</option>
                  <option value="3rd">3rd Shift</option>
                </select>
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
                  {errors.address && <p className="text-[var(--color-harvest-gold)] text-sm mt-1">{errors.address}</p>}
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
              {errors.pickupLocation && <p className="text-[var(--color-harvest-gold)] text-sm mt-1">{errors.pickupLocation}</p>}
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
            <div className={`grid gap-4 ${isPremiumUser ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
              {isPremiumUser && (
                <button
                  type="button"
                  onClick={() => updateFormData('paymentMethod', 'cash')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    formData.paymentMethod === 'cash'
                      ? 'border-gold-foil bg-gold-foil bg-opacity-10'
                      : 'border-[#333333] hover:border-[#555555]'
                  }`}
                >
                  <div className="mx-auto mb-2 text-xl">&#128181;</div>
                  <div className="font-medium">Cash {formData.orderType === 'delivery' ? 'on Delivery' : 'on Pickup'}</div>
                  <div className="text-xs text-gold-foil mt-1">Premium Only</div>
                </button>
              )}
            </div>
            {!isPremiumUser && (
              <div className="mt-4 p-3 bg-[#111111] border border-[#333333] rounded-lg">
                <p className="text-sm text-gray-400">
                  💎 <span className="text-gold-foil font-medium">Cash on Delivery</span> is available for Gold tier members (1000+ points).
                  <br />Upgrade your membership to unlock this payment option!
                </p>
              </div>
            )}
          </div>

          {/* Credit Card Form - Replace with Stripe */}
          {formData.paymentMethod === 'card' && (
          <StripePaymentForm
            amount={total}
            onPaymentSuccess={(paymentIntentId) => {
              // Update form data with payment info
              updateNestedFormData('paymentInfo', 'stripePaymentIntentId', paymentIntentId)
              // Proceed to create order
              handleSubmit(paymentIntentId)
            }}
            onPaymentError={(error) => {
              console.error('Payment Error:', error)
            }}
            disabled={isLoading}
            orderMetadata={{
              email: formData.email,
              phone: formData.phone,
              orderType: formData.orderType,
              // Lunch Drop (optional)
              workplaceName: workplaceName || '',
              workplaceShift: ['1st','2nd','3rd'].includes(workplaceShift) ? workplaceShift : '',
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
                <div className="flex justify-between font-bold text-lg border-t border-[#333333] pt-2 mt-2">
                  <span>Total:</span>
                  <span className="text-gold-foil">${(total + (formData.orderType === 'delivery' && subtotal < 50 ? 4.99 : 0)).toFixed(2)}</span>
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
              onClick={() => handleSubmit()}
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