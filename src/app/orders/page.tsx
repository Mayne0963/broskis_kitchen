"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "../../lib/context/AuthContext"
import { useOrder } from "../../lib/context/OrderContext"
import { FaArrowLeft, FaShoppingBag, FaHistory } from "react-icons/fa"
import Link from "next/link"
import { useEffect } from "react"
import OrderTracking from "../../components/orders/OrderTracking"

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic'

export default function OrderHistoryPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { orders, getUserOrders, isLoading: ordersLoading } = useOrder()

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    router.push("/auth/login")
    return null
  }

  // Fetch user orders on component mount
  useEffect(() => {
    if (user) {
      getUserOrders(user.uid)
    }
  }, [user, getUserOrders])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-rich-black)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-foil mx-auto mb-4"></div>
          <p className="text-white">Loading your orders...</p>
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
