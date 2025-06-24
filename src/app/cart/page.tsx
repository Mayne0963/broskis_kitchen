"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "../../lib/context/CartContext"
import { useAuth } from "../../lib/context/AuthContext"
import { OrderItem } from "../../types/order"
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowLeft, FaCreditCard, FaCog, FaLock, FaUserPlus } from "react-icons/fa"

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, tax, total, clearCart } = useCart()
  const { user } = useAuth()
  const [promoCode, setPromoCode] = useState("")
  const [promoError, setPromoError] = useState<string | null>(null)

  const isAuthenticated = !!user

  const handleQuantityChange = (id: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity)
    }
  }

  const handlePromoCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (promoCode.trim() === "") {
      setPromoError("Please enter a promo code")
      return
    }

    // In a real app, you would validate the promo code with an API
    setPromoError("Invalid promo code")
  }

  // Check if an item has customizations
  const hasCustomizations = (item: OrderItem) => {
    return item.customizations && Object.keys(item.customizations).length > 0
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

          <div className="bg-[#1A1A1A] rounded-lg p-12 text-center">
            <div className="w-20 h-20 bg-[#222222] rounded-full flex items-center justify-center mx-auto mb-6">
              <FaShoppingCart className="text-gray-500 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
              <FaArrowLeft size={14} /> Browse Menu
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-[#1A1A1A] rounded-lg overflow-hidden border border-[#333333]">
              <div className="p-4 bg-[#111111] border-b border-[#333333] flex justify-between items-center">
                <h2 className="font-bold">Items ({items.length})</h2>
                <button onClick={clearCart} className="text-sm text-gray-400 hover:text-blood-red transition-colors">
                  Clear Cart
                </button>
              </div>

              <ul className="divide-y divide-[#333333]">
                {items.map((item) => (
                  <li key={item.id} className="p-4 flex flex-col">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-[#222222] rounded-lg overflow-hidden relative flex-shrink-0">
                        {item.image ? (
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaShoppingCart className="text-gray-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{item.name.split(" (")[0]}</h3>
                          {hasCustomizations(item) && (
                            <span className="bg-gold-foil bg-opacity-20 text-gold-foil text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <FaCog size={10} /> Customized
                            </span>
                          )}
                        </div>
                        <div className="text-gold-foil font-bold mt-1">${item.price.toFixed(2)}</div>

                        {/* Display customizations if any */}
                        {hasCustomizations(item) && (
                          <div className="mt-2 text-sm text-gray-400">
                            {Object.values(item.customizations ?? {})
                              .flat()
                              .map((option, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{option.name}</span>
                                  {option.price > 0 && <span>+${option.price.toFixed(2)}</span>}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-[#333333] rounded-md">
                          <button
                            className="px-2 py-1 text-white hover:bg-[#333333] transition-colors"
                            onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                          >
                            <FaMinus size={12} />
                          </button>
                          <span className="px-3 py-1 text-white">{item.quantity}</span>
                          <button
                            className="px-2 py-1 text-white hover:bg-[#333333] transition-colors"
                            onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-blood-red transition-colors"
                          aria-label="Remove item"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <Link href="/menu" className="text-gold-foil hover:underline inline-flex items-center gap-2">
                <FaArrowLeft size={14} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#1A1A1A] rounded-lg border border-[#333333] p-6">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax (8.25%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                {!isAuthenticated ? (
                  <div className="pt-4 border-t border-[#333333]">
                    <div className="bg-[#111111] p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <FaLock className="text-gold-foil" />
                        <span className="text-sm font-medium">Promo Codes - Login Required</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        Sign in to apply promo codes and unlock exclusive discounts!
                      </p>
                      <div className="flex gap-2">
                        <Link href="/auth/login" className="btn-outline text-xs px-3 py-1 flex-1 text-center">
                          Login
                        </Link>
                        <Link href="/auth/signup" className="btn-primary text-xs px-3 py-1 flex-1 text-center">
                          Sign Up
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePromoCode} className="pt-4 border-t border-[#333333]">
                    <label className="block text-sm font-medium mb-2">Promo Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-grow"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value)
                          setPromoError(null)
                        }}
                        placeholder="Enter code"
                      />
                      <button type="submit" className="btn-outline whitespace-nowrap">
                        Apply
                      </button>
                    </div>
                    {promoError && <p className="text-blood-red text-sm mt-1">{promoError}</p>}
                  </form>
                )}

                <div className="flex justify-between pt-4 border-t border-[#333333] font-bold">
                  <span>Total</span>
                  <span className="text-gold-foil">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">
                <FaCreditCard /> Proceed to Checkout
              </Link>

              <p className="text-xs text-gray-500 mt-4 text-center">Taxes and shipping calculated at checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
