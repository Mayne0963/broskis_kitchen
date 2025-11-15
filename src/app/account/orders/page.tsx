"use client"

import { useAuth } from "@/lib/context/AuthContext"
import { useOrders, OrderProvider } from "@/lib/context/OrderContext"
import { FaArrowLeft, FaShoppingBag } from "react-icons/fa"
import Link from "next/link"
import { useEffect } from "react"
import OrderTracking from "@/components/orders/OrderTracking"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { validateUserId } from "@/lib/utils/userIdValidation"

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'

function OrderHistoryPageContent() {
  const { user, isLoading: authLoading } = useAuth()
  const { orders, loading: ordersLoading, refresh, error } = useOrders()

  // Fetch user orders on component mount
  useEffect(() => {
    if (!authLoading) {
      refresh()
    }
  }, [authLoading, refresh])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-rich-black)] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-foil mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-rich-black)] text-white flex items-center justify-center">
        <div className="text-center p-8">
          <FaShoppingBag className="text-6xl text-gold-foil mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
          <p className="text-muted-foreground mb-6">You need to be logged in to view your orders.</p>
          <Link 
            href="/auth/login?callbackUrl=/account/orders" 
            className="inline-block bg-gold-foil text-black px-6 py-3 rounded-lg font-semibold hover:bg-gold-foil/90 transition"
          >
            Log In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-rich-black)] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your orders</p>
          </div>
          <Link href="/profile" className="text-gold-foil hover:underline flex items-center">
            <FaArrowLeft className="mr-2" /> Back to Profile
          </Link>
        </div>
        
        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded border border-red-500/40 bg-red-500/10 text-red-200">
            {error}
          </div>
        )}

        {ordersLoading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-foil mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="text-center p-16 border border-red-500/20 rounded-lg">
            <FaShoppingBag className="text-5xl text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Orders</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => refresh()} 
              className="inline-block bg-gold-foil text-black px-5 py-2 rounded-md font-semibold hover:bg-gold-foil/90"
            >
              Try Again
            </button>
          </div>
        ) : orders && orders.length > 0 ? (
          <OrderTracking userId={validateUserId(user?.id) ? user.id : ''} initialOrders={orders} />
        ) : (
          <div className="text-center p-16 border border-[var(--color-ash-gray)]/20 rounded-lg">
            <FaShoppingBag className="text-5xl text-gold-foil mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">When you place orders, they&apos;ll show up here for tracking.</p>
            <Link href="/" className="inline-block mt-6 bg-gold-foil text-black px-5 py-2 rounded-md font-semibold hover:bg-gold-foil/90">Explore Menu</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderHistoryPage() {
  return (
    <AuthGuard requireAuth={true} requireEmailVerification={false}>
      <OrderProvider autoLoad={true}>
        <OrderHistoryPageContent />
      </OrderProvider>
    </AuthGuard>
  )
}
