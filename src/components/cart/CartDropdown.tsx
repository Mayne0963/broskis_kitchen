"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { FaShoppingBag, FaTrash, FaMinus, FaPlus } from "react-icons/fa"
import { useCart } from "../../lib/context/CartContext"

const CartDropdown: React.FC = () => {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleQuantityChange = (id: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity)
    } else {
      removeItem(id)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-gold-foil transition-colors"
        aria-label="Shopping cart"
      >
        <FaShoppingBag className="text-xl" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gold-foil text-black text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {itemCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="cart-dropdown absolute right-0 mt-2 w-80 bg-matte-black border-2 border-gold-foil rounded-lg shadow-xl z-50">
          <div className="cart-header bg-gradient-to-r from-gold-foil to-blood-red p-3 text-black font-bold rounded-t-lg">
            Your Cart
          </div>

          <div className="p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <FaShoppingBag className="text-4xl mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400">Your cart is empty</p>
                <p className="text-xs text-gray-500 mt-1">Add some delicious items to get started</p>
              </div>
            ) : (
              <>
                <ul className="max-h-60 overflow-y-auto space-y-3 cart-items">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="cart-item flex items-center gap-3 p-3 rounded border-b border-[#333333]"
                    >
                      <div className="w-14 h-14 bg-[#1A1A1A] rounded flex-shrink-0 overflow-hidden relative">
                        {item.image ? (
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover"
            unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#333333]">
                            <FaShoppingBag size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="text-white text-sm font-medium">{item.name}</p>
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="mt-1">
                            {Object.entries(item.customizations).map(([categoryId, customizations]) => (
                              <div key={categoryId}>
                                {categoryId === 'options' ? (
                                  customizations.map((customization, index) => (
                                    <span key={index} className="text-xs text-gray-400 block">
                                      {customization.name}
                                    </span>
                                  ))
                                ) : (
                                  customizations.map((customization, index) => (
                                    <span key={index} className="text-xs text-gray-400 block">
                                      + {customization.name} {customization.price > 0 && `(+$${customization.price.toFixed(2)})`}
                                    </span>
                                  ))
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <div className="quantity-control flex items-center">
                            <button
                              className="quantity-button bg-[#222222] hover:bg-[#333333] w-5 h-5 flex items-center justify-center rounded"
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                            >
                              <FaMinus size={8} />
                            </button>
                            <span className="mx-2 text-xs text-gray-400">{item.quantity}</span>
                            <button
                              className="quantity-button bg-[#222222] hover:bg-[#333333] w-5 h-5 flex items-center justify-center rounded"
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                            >
                              <FaPlus size={8} />
                            </button>
                          </div>
                          <span className="text-xs text-gold-foil font-bold">${item.price.toFixed(2)}</span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[var(--color-harvest-gold)] hover:text-[var(--color-harvest-gold)] transition-colors"
                            aria-label="Remove item"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-3 border-t border-[#333333]">
                  <div className="flex justify-between mb-3">
                    <span className="text-white font-medium">Total:</span>
                    <span className="text-gold-foil font-bold">${total.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <Link
                      href="/cart"
                      className="btn-outline block text-center w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      View Cart
                    </Link>
                    <Link
                      href="/checkout"
                      className="btn-primary block text-center w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      Lunch Drop - Individual
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CartDropdown
