'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/context/CartContext'
import { useAuth } from '@/lib/context/AuthContext'
import CheckoutClient from '@/components/checkout/CheckoutClient'

// Mock function to get user addresses - replace with actual implementation
async function getUserAddresses(userId: string) {
  // TODO: Replace with actual API call
  return [
    {
      id: '1',
      type: 'home',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      isDefault: true
    },
    {
      id: '2',
      type: 'work',
      street: '456 Market St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      isDefault: false
    }
  ]
}

// Mock function to get user payment methods - replace with actual implementation
async function getPaymentMethods(userId: string) {
  // TODO: Replace with actual API call
  return [
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    },
    {
      id: '2',
      type: 'card',
      last4: '5555',
      brand: 'mastercard',
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false
    }
  ]
}

export default function CheckoutPage() {
  const { items, subtotal, tax, total, itemCount } = useCart()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // No authentication redirect - allow guest checkout
  // Users can proceed without being logged in
  
  // Load user data (only for authenticated users)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        
        if (user?.id && isAuthenticated) {
          // Load saved addresses and payment methods for authenticated users
          const [addressesData, paymentMethodsData] = await Promise.all([
            getUserAddresses(user.id),
            getPaymentMethods(user.id)
          ])
          
          setAddresses(addressesData)
          setPaymentMethods(paymentMethodsData)
        } else {
          // For guest users, start with empty arrays
          setAddresses([])
          setPaymentMethods([])
        }
      } catch (err) {
        console.error('Failed to load user data:', err)
        setError('Failed to load checkout data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    // Only load data after auth loading is complete
    if (!authLoading) {
      loadUserData()
    }
  }, [user?.id, isAuthenticated, authLoading])
  
  // Check if cart is empty
  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-rich-black)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Your Cart is Empty</h1>
          <p className="text-gray-400 mb-6">Add some delicious items to your cart before checking out.</p>
          <a 
            href="/menu" 
            className="bg-[var(--color-harvest-gold)] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-harvest-gold)]/90 transition-colors"
          >
            Browse Menu
          </a>
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-rich-black)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-harvest-gold)] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading checkout...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-rich-black)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unable to Load Checkout</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[var(--color-harvest-gold)] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-harvest-gold)]/90 transition-colors mr-4"
          >
            Try Again
          </button>
          <a 
            href="/cart" 
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Return to Cart
          </a>
        </div>
      </div>
    )
  }
  
  // Calculate delivery fee based on subtotal
  const deliveryFee = subtotal > 50 ? 0 : 3.99
  const finalTotal = total + deliveryFee
  
  const cartData = {
    items,
    subtotal,
    tax,
    deliveryFee,
    total: finalTotal
  }
  
  return (
    <div className="min-h-screen bg-[var(--color-rich-black)] py-8">
      <div className="container mx-auto px-4">
        <CheckoutClient 
          cartData={cartData}
          addresses={addresses}
          paymentMethods={paymentMethods}
          userId={user?.id || ''}
          isAuthenticated={isAuthenticated}
          userEmail={user?.email || ''}
        />
      </div>
    </div>
  )
}