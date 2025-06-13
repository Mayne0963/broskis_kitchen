"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCart } from "../../lib/context/CartContext"
import CheckoutForm from "../../components/checkout/CheckoutForm"
import { FaArrowLeft, FaShoppingBag, FaCheck } from "react-icons/fa"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, tax, total } = useCart()
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const handleOrderComplete = (newOrderId: string) => {
    setOrderId(newOrderId)
    setOrderComplete(true)
  }

  // Redirect if cart is empty
  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <FaShoppingBag className="mx-auto text-6xl text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-400 mb-8">Add some items to your cart before checking out.</p>
          <Link href="/menu" className="bg-gold-foil text-black px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors">
            Browse Menu
          </Link>
        </div>
      </div>
    )
  }

  // Order success page
  if (orderComplete && orderId) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-[#1A1A1A] rounded-lg border border-[#333333] p-8">
            <FaCheck className="mx-auto text-6xl text-emerald-green mb-6" />
            <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-gray-400 mb-6">
              Thank you for your order. We've received your payment and are preparing your food.
            </p>
            <div className="bg-[#111111] rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">Order Number</p>
              <p className="text-xl font-bold text-gold-foil">{orderId}</p>
            </div>
            <div className="space-y-4">
              <Link
                href={`/orders`}
                className="block bg-gold-foil text-black px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
              >
                Track Your Order
              </Link>
              <Link
                href="/menu"
                className="block border border-gold-foil text-gold-foil px-6 py-3 rounded-lg font-semibold hover:bg-gold-foil hover:text-black transition-colors"
              >
                Continue Shopping
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
        
        <CheckoutForm onOrderComplete={handleOrderComplete} />
      </div>
    </div>
  )
}
