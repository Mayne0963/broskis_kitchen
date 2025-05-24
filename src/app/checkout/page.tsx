"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "../../lib/context/CartContext"
import { FaArrowLeft, FaCreditCard, FaLock, FaShoppingBag, FaCheck, FaExclamationTriangle } from "react-icons/fa"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, tax, total, clearCart } = useCart()
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    // Contact Information
    email: "",
    phone: "",

    // Delivery Information
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    deliveryInstructions: "",

    // Payment Information
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",

    // Order Type
    orderType: "delivery", // delivery or pickup

    // Pickup Location (if pickup selected)
    pickupLocation: "",

    // Delivery Options
    deliveryTime: "asap", // asap, scheduled
    scheduledTime: "",

    // Promo Code
    promoCode: "",

    // Terms
    agreeToTerms: false,
  })

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderComplete) {
      router.push("/cart")
    }
  }, [items, router, orderComplete])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  // Handle order type change
  const handleOrderTypeChange = (type: "delivery" | "pickup") => {
    setFormData({
      ...formData,
      orderType: type,
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form based on current step
    if (!validateForm()) {
      return
    }

    if (step < 3) {
      // Move to next step
      setStep(step + 1)
      window.scrollTo(0, 0)
      return
    }

    // Process payment and complete order
    setIsProcessing(true)
    setError(null)

    try {
      // Simulate API call to process payment and create order
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate a random order ID
      const newOrderId = `BK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
      setOrderId(newOrderId)

      // Clear cart and show success
      clearCart()
      setOrderComplete(true)
    } catch (err) {
      console.error("Order processing error:", err)
      setError("There was an error processing your payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Validate form based on current step
  const validateForm = () => {
    const isValid = true
    const errors: Record<string, string> = {}

    if (step === 1) {
      // Validate contact and delivery information
      if (!formData.email) errors.email = "Email is required"
      if (!formData.phone) errors.phone = "Phone number is required"

      if (formData.orderType === "delivery") {
        if (!formData.firstName) errors.firstName = "First name is required"
        if (!formData.lastName) errors.lastName = "Last name is required"
        if (!formData.address) errors.address = "Address is required"
        if (!formData.city) errors.city = "City is required"
        if (!formData.state) errors.state = "State is required"
        if (!formData.zipCode) errors.zipCode = "ZIP code is required"
      } else {
        if (!formData.pickupLocation) errors.pickupLocation = "Please select a pickup location"
      }
    } else if (step === 2) {
      // Validate payment information
      if (!formData.cardNumber) errors.cardNumber = "Card number is required"
      else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, "")))
        errors.cardNumber = "Please enter a valid 16-digit card number"

      if (!formData.cardName) errors.cardName = "Name on card is required"

      if (!formData.expiryDate) errors.expiryDate = "Expiry date is required"
      else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) errors.expiryDate = "Please use MM/YY format"

      if (!formData.cvv) errors.cvv = "CVV is required"
      else if (!/^\d{3,4}$/.test(formData.cvv)) errors.cvv = "CVV must be 3 or 4 digits"

      if (!formData.agreeToTerms) errors.agreeToTerms = "You must agree to the terms and conditions"
    }

    if (Object.keys(errors).length > 0) {
      setError("Please correct the errors in the form")
      return false
    }

    setError(null)
    return true
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value)
    setFormData({
      ...formData,
      cardNumber: formattedValue,
    })
  }

  // Handle expiry date input
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = e.target
    value = value.replace(/\D/g, "")

    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`
    }

    setFormData({
      ...formData,
      expiryDate: value,
    })
  }

  // If order is complete, show success page
  if (orderComplete) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-[#1A1A1A] rounded-lg p-8 shadow-lg border border-[#333333]">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-emerald-green bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-emerald-green text-3xl" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-gray-300">
                Thank you for your order. Your order has been received and is being prepared.
              </p>
            </div>

            <div className="bg-[#111111] p-6 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Order #{orderId}</h2>
                <span className="bg-emerald-green bg-opacity-20 text-emerald-green px-3 py-1 rounded-full text-sm">
                  Confirmed
                </span>
              </div>

              <div className="border-t border-[#333333] pt-4 mt-4">
                <p className="text-gray-300 mb-2">
                  <strong>Order Type:</strong> {formData.orderType === "delivery" ? "Delivery" : "Pickup"}
                </p>
                {formData.orderType === "delivery" ? (
                  <p className="text-gray-300 mb-2">
                    <strong>Delivery Address:</strong> {formData.address}, {formData.city}, {formData.state}{" "}
                    {formData.zipCode}
                  </p>
                ) : (
                  <p className="text-gray-300 mb-2">
                    <strong>Pickup Location:</strong> {formData.pickupLocation}
                  </p>
                )}
                <p className="text-gray-300">
                  <strong>Estimated Time:</strong>{" "}
                  {formData.deliveryTime === "asap" ? "30-45 minutes" : formData.scheduledTime}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-3">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#333333] pt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-400">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-gold-foil">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="btn-outline flex-1 text-center">
                Return to Home
              </Link>
              <Link href="/menu" className="btn-primary flex-1 text-center">
                Order Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <Link href="/cart" className="text-gold-foil hover:underline flex items-center">
            <FaArrowLeft className="mr-2" /> Back to Cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#333333] mb-6">
              {/* Checkout Steps */}
              <div className="bg-[#111111] p-4 border-b border-[#333333]">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-gold-foil text-black" : "bg-[#333333] text-white"}`}
                  >
                    1
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${step >= 2 ? "bg-gold-foil" : "bg-[#333333]"}`}></div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-gold-foil text-black" : "bg-[#333333] text-white"}`}
                  >
                    2
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${step >= 3 ? "bg-gold-foil" : "bg-[#333333]"}`}></div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-gold-foil text-black" : "bg-[#333333] text-white"}`}
                  >
                    3
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span>Delivery</span>
                  <span>Payment</span>
                  <span>Review</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                {error && (
                  <div className="bg-blood-red bg-opacity-20 text-blood-red p-4 rounded-md mb-6 flex items-start">
                    <FaExclamationTriangle className="mr-2 mt-1 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Step 1: Delivery Information */}
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input w-full"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="input w-full"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold mb-4">Order Type</h2>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                          type="button"
                          className={`p-4 rounded-lg border ${
                            formData.orderType === "delivery"
                              ? "border-gold-foil bg-gold-foil bg-opacity-10"
                              : "border-[#333333] hover:border-[#555555]"
                          } flex flex-col items-center`}
                          onClick={() => handleOrderTypeChange("delivery")}
                        >
                          <span className="text-xl mb-2">🚚</span>
                          <span className="font-medium">Delivery</span>
                        </button>
                        <button
                          type="button"
                          className={`p-4 rounded-lg border ${
                            formData.orderType === "pickup"
                              ? "border-gold-foil bg-gold-foil bg-opacity-10"
                              : "border-[#333333] hover:border-[#555555]"
                          } flex flex-col items-center`}
                          onClick={() => handleOrderTypeChange("pickup")}
                        >
                          <span className="text-xl mb-2">🏬</span>
                          <span className="font-medium">Pickup</span>
                        </button>
                      </div>
                    </div>

                    {formData.orderType === "delivery" ? (
                      <div>
                        <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                              First Name *
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleChange}
                              className="input w-full"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              className="input w-full"
                              required
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label htmlFor="address" className="block text-sm font-medium mb-1">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="input w-full"
                            required
                          />
                        </div>

                        <div className="mt-4">
                          <label htmlFor="apartment" className="block text-sm font-medium mb-1">
                            Apartment, Suite, etc. (optional)
                          </label>
                          <input
                            type="text"
                            id="apartment"
                            name="apartment"
                            value={formData.apartment}
                            onChange={handleChange}
                            className="input w-full"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <label htmlFor="city" className="block text-sm font-medium mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              className="input w-full"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="state" className="block text-sm font-medium mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              id="state"
                              name="state"
                              value={formData.state}
                              onChange={handleChange}
                              className="input w-full"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="zipCode" className="block text-sm font-medium mb-1">
                              ZIP Code *
                            </label>
                            <input
                              type="text"
                              id="zipCode"
                              name="zipCode"
                              value={formData.zipCode}
                              onChange={handleChange}
                              className="input w-full"
                              required
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label htmlFor="deliveryInstructions" className="block text-sm font-medium mb-1">
                            Delivery Instructions (optional)
                          </label>
                          <textarea
                            id="deliveryInstructions"
                            name="deliveryInstructions"
                            value={formData.deliveryInstructions}
                            onChange={handleChange}
                            className="input w-full h-20"
                            placeholder="Apartment access code, delivery preferences, etc."
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-xl font-bold mb-4">Pickup Location</h2>
                        <div>
                          <label htmlFor="pickupLocation" className="block text-sm font-medium mb-1">
                            Select Location *
                          </label>
                          <select
                            id="pickupLocation"
                            name="pickupLocation"
                            value={formData.pickupLocation}
                            onChange={handleChange}
                            className="input w-full"
                            required
                          >
                            <option value="">Select a location</option>
                            <option value="Downtown LA">Downtown LA - 420 S Grand Ave</option>
                            <option value="Hollywood">Hollywood - 6801 Hollywood Blvd</option>
                            <option value="SF Mission">SF Mission District - 2534 Mission St</option>
                            <option value="SF Marina">SF Marina District - 2108 Chestnut St</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <h2 className="text-xl font-bold mb-4">Delivery Time</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <label
                          className={`p-4 rounded-lg border cursor-pointer ${
                            formData.deliveryTime === "asap"
                              ? "border-gold-foil bg-gold-foil bg-opacity-10"
                              : "border-[#333333]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryTime"
                            value="asap"
                            checked={formData.deliveryTime === "asap"}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className="flex flex-col items-center">
                            <span className="text-xl mb-2">⚡</span>
                            <span className="font-medium">As Soon As Possible</span>
                            <span className="text-xs text-gray-400 mt-1">30-45 min</span>
                          </div>
                        </label>
                        <label
                          className={`p-4 rounded-lg border cursor-pointer ${
                            formData.deliveryTime === "scheduled"
                              ? "border-gold-foil bg-gold-foil bg-opacity-10"
                              : "border-[#333333]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryTime"
                            value="scheduled"
                            checked={formData.deliveryTime === "scheduled"}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className="flex flex-col items-center">
                            <span className="text-xl mb-2">🕒</span>
                            <span className="font-medium">Schedule for Later</span>
                            <span className="text-xs text-gray-400 mt-1">Select a time</span>
                          </div>
                        </label>
                      </div>

                      {formData.deliveryTime === "scheduled" && (
                        <div className="mt-4">
                          <label htmlFor="scheduledTime" className="block text-sm font-medium mb-1">
                            Select Time *
                          </label>
                          <select
                            id="scheduledTime"
                            name="scheduledTime"
                            value={formData.scheduledTime}
                            onChange={handleChange}
                            className="input w-full"
                            required
                          >
                            <option value="">Select a time</option>
                            <option value="Today, 12:00 PM">Today, 12:00 PM</option>
                            <option value="Today, 1:00 PM">Today, 1:00 PM</option>
                            <option value="Today, 2:00 PM">Today, 2:00 PM</option>
                            <option value="Today, 3:00 PM">Today, 3:00 PM</option>
                            <option value="Today, 4:00 PM">Today, 4:00 PM</option>
                            <option value="Today, 5:00 PM">Today, 5:00 PM</option>
                            <option value="Today, 6:00 PM">Today, 6:00 PM</option>
                            <option value="Today, 7:00 PM">Today, 7:00 PM</option>
                            <option value="Today, 8:00 PM">Today, 8:00 PM</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Payment Information */}
                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold mb-4">Payment Information</h2>
                      <div className="bg-[#111111] p-4 rounded-lg mb-6 flex items-center">
                        <FaLock className="text-gold-foil mr-2" />
                        <span className="text-sm">Your payment information is encrypted and secure.</span>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
                          Card Number *
                        </label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleCardNumberChange}
                          className="input w-full"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="cardName" className="block text-sm font-medium mb-1">
                          Name on Card *
                        </label>
                        <input
                          type="text"
                          id="cardName"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleChange}
                          className="input w-full"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="expiryDate" className="block text-sm font-medium mb-1">
                            Expiry Date *
                          </label>
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleExpiryDateChange}
                            className="input w-full"
                            placeholder="MM/YY"
                            maxLength={5}
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="cvv" className="block text-sm font-medium mb-1">
                            CVV *
                          </label>
                          <input
                            type="text"
                            id="cvv"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleChange}
                            className="input w-full"
                            placeholder="123"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold mb-4">Billing Address</h2>
                      <div className="mb-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={true}
                            className="rounded border-[#333333] text-gold-foil focus:ring-gold-foil mr-2"
                            readOnly
                          />
                          <span>Same as delivery address</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold mb-4">Promo Code</h2>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="promoCode"
                          name="promoCode"
                          value={formData.promoCode}
                          onChange={handleChange}
                          className="input flex-grow"
                          placeholder="Enter promo code"
                        />
                        <button type="button" className="btn-outline whitespace-nowrap">
                          Apply
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          name="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onChange={handleChange}
                          className="rounded border-[#333333] text-gold-foil focus:ring-gold-foil mt-1 mr-2"
                          required
                        />
                        <span className="text-sm">
                          I agree to the{" "}
                          <Link href="/terms" className="text-gold-foil hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy" className="text-gold-foil hover:underline">
                            Privacy Policy
                          </Link>
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3: Review Order */}
                {step === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-xl font-bold mb-4">Review Your Order</h2>

                      <div className="bg-[#111111] p-4 rounded-lg mb-6">
                        <h3 className="font-bold mb-2">Order Details</h3>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-400">Order Type:</span>{" "}
                            <span className="font-medium">
                              {formData.orderType === "delivery" ? "Delivery" : "Pickup"}
                            </span>
                          </p>

                          {formData.orderType === "delivery" ? (
                            <>
                              <p>
                                <span className="text-gray-400">Delivery Address:</span>{" "}
                                <span className="font-medium">
                                  {formData.address}
                                  {formData.apartment ? `, ${formData.apartment}` : ""}, {formData.city},{" "}
                                  {formData.state} {formData.zipCode}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-400">Recipient:</span>{" "}
                                <span className="font-medium">
                                  {formData.firstName} {formData.lastName}
                                </span>
                              </p>
                            </>
                          ) : (
                            <p>
                              <span className="text-gray-400">Pickup Location:</span>{" "}
                              <span className="font-medium">{formData.pickupLocation}</span>
                            </p>
                          )}

                          <p>
                            <span className="text-gray-400">Time:</span>{" "}
                            <span className="font-medium">
                              {formData.deliveryTime === "asap"
                                ? "As soon as possible (30-45 min)"
                                : formData.scheduledTime}
                            </span>
                          </p>

                          <p>
                            <span className="text-gray-400">Contact:</span>{" "}
                            <span className="font-medium">
                              {formData.email} | {formData.phone}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#111111] p-4 rounded-lg mb-6">
                        <h3 className="font-bold mb-2">Payment Method</h3>
                        <div className="flex items-center">
                          <div className="bg-[#222222] p-2 rounded mr-3">
                            <FaCreditCard className="text-gold-foil" />
                          </div>
                          <div>
                            <p className="font-medium">Credit Card</p>
                            <p className="text-sm text-gray-400">**** **** **** {formData.cardNumber.slice(-4)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#111111] p-4 rounded-lg mb-6">
                        <h3 className="font-bold mb-4">Order Items</h3>
                        <div className="space-y-4">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center">
                              <div className="w-12 h-12 bg-[#222222] rounded-lg overflow-hidden relative flex-shrink-0 mr-3">
                                {item.image ? (
                                  <Image
                                    src={item.image || "/placeholder.svg"}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FaShoppingBag className="text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    {item.quantity} × {item.name}
                                  </span>
                                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  {step > 1 ? (
                    <button type="button" className="btn-outline" onClick={() => setStep(step - 1)}>
                      Back
                    </button>
                  ) : (
                    <Link href="/cart" className="btn-outline">
                      Back to Cart
                    </Link>
                  )}

                  <button type="submit" className="btn-primary flex items-center gap-2" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : step < 3 ? (
                      "Continue"
                    ) : (
                      <>
                        <FaCreditCard /> Place Order
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#1A1A1A] rounded-lg border border-[#333333] p-6 sticky top-32">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#333333] pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax (8.25%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Delivery Fee</span>
                  <span>$4.99</span>
                </div>

                <div className="flex justify-between pt-4 border-t border-[#333333] font-bold">
                  <span>Total</span>
                  <span className="text-gold-foil">${(total + 4.99).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[#111111] rounded-lg">
                <h3 className="font-bold mb-2 flex items-center">
                  <FaLock className="text-gold-foil mr-2" /> Secure Checkout
                </h3>
                <p className="text-sm text-gray-400">
                  Your payment information is encrypted and secure. We never store your full credit card details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
