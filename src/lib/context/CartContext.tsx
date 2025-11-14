"use client"

import React, { createContext, useState, useContext, useEffect, type ReactNode } from "react"
import type { CartContextType, CartItem } from "@/types"
import { toast } from "sonner"
import { loadSessionOrder, saveSessionOrder, clearSessionOrder, saveLocalSnapshot, makeOrderPayload } from "@/lib/utils/orderPersistence"

// Create the context with a default undefined value
const CartContext = createContext<CartContextType | undefined>(undefined)

// Provider component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading] = useState<boolean>(false)
  const [error] = useState<string | null>(null)

  // Calculate cart totals
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const tax = subtotal * 0.0825 // 8.25% tax rate
  const total = subtotal + tax
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  // Add item to cart
  const addItem = (newItem: CartItem) => {
    setItems((currentItems) => {
      try { console.log('[CART] addItem', { id: newItem.id, name: newItem.name, qty: newItem.quantity, price: newItem.price }); } catch {}
      // For customized items, we don't want to combine them
      if (newItem.customizations && Object.keys(newItem.customizations).length > 0) {
        toast.success("Customized item added to cart", {
          description: `${newItem.name} added to your cart`,
        })
        return [...currentItems, newItem]
      }

      // Check if item already exists in cart (for non-customized items)
      const existingItemIndex = currentItems.findIndex(
        (item) => item.id === newItem.id && (!item.customizations || Object.keys(item.customizations).length === 0),
      )

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...currentItems]
        updatedItems[existingItemIndex].quantity += newItem.quantity
        try { console.log('[CART] updated qty', { id: newItem.id, qty: updatedItems[existingItemIndex].quantity }); } catch {}

        toast.success("Item updated in cart", {
          description: `${newItem.name} quantity increased to ${updatedItems[existingItemIndex].quantity}`,
        })

        return updatedItems
      } else {
        // Add new item if it doesn't exist
        toast.success("Item added to cart", {
          description: `${newItem.name} added to your cart`,
        })
        try { console.log('[CART] item added, count ->', currentItems.length + 1); } catch {}

        return [...currentItems, newItem]
      }
    })
  }

  // Remove item from cart
  const removeItem = (id: string) => {
    setItems((currentItems) => {
      const itemToRemove = currentItems.find((item) => item.id === id)
      if (itemToRemove) {
        toast.success("Item removed from cart", {
          description: `${itemToRemove.name} removed from your cart`,
        })
      }
      return currentItems.filter((item) => item.id !== id)
    })
  }

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  // Clear cart
  const clearCart = () => {
    setItems([])
    toast.success("Cart cleared", {
      description: "All items have been removed from your cart",
    })
    try { clearSessionOrder() } catch {}
  }

  useEffect(() => {
    try {
      const sessionOrder = loadSessionOrder()
      if (sessionOrder && Array.isArray(sessionOrder.items) && sessionOrder.items.length > 0) {
        setItems(sessionOrder.items as any)
        try { console.log('[CART] loaded from session', sessionOrder.items.length); } catch {}
        return
      }
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        setItems(JSON.parse(savedCart))
        try { console.log('[CART] loaded from local', JSON.parse(savedCart)?.length ?? 0); } catch {}
      }
    } catch (err) {
      console.error("Failed to load cart:", err)
    }
  }, [])

  useEffect(() => {
    try {
      try { console.log('[CART] items changed', items.length); } catch {}
      localStorage.setItem("cart", JSON.stringify(items))
      if ((items?.length ?? 0) > 0) {
        const payload = makeOrderPayload(items as any)
        saveSessionOrder(payload)
        if (items.length === 1) {
          saveLocalSnapshot(payload)
        }
      }
    } catch (err) {
      console.error("Failed to persist order:", err)
    }
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        total,
        itemCount,
        loading,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to use the cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext)

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }

  return context
}
