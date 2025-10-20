"use client"

import { useAuth } from "../../lib/context/AuthContext"
import { useOrders, OrderProvider } from "../../lib/context/OrderContext"
import { FaArrowLeft, FaShoppingBag, FaHistory } from "react-icons/fa"
import Link from "next/link"
import { useEffect } from "react"
import OrderTracking from "../../components/orders/OrderTracking"
import { AuthGuard } from "../../components/auth/AuthGuard"

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'

function OrderHistoryPageContent() {
  const { user } = useAuth()
  const { orders, loading: ordersLoading, refresh } = useOrders()

  // Fetch user orders on component mount
  useEffect(() => {
    if (user) {
      refresh()
    }
  }, [user, refresh])

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
        
        {user ? (
          <OrderTracking userId={user.uid} initialOrders={orders} />
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground">Please log in to view your orders.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderHistoryPage() {
  return (
    <AuthGuard requireEmailVerification={true}>
      <OrderProvider autoLoad={true}>
        <OrderHistoryPageContent />
      </OrderProvider>
    </AuthGuard>
  )
}
