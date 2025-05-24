"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "../../lib/context/AuthContext"
import { FaHistory, FaShoppingBag, FaArrowLeft } from "react-icons/fa"
import Link from "next/link"

export default function OrderHistoryPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    router.push("/auth/login")
    return null
  }

  // This would normally be fetched from an API
  const orders: any[] = []

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Order History</h1>
          <Link href="/profile" className="text-gold-foil hover:underline flex items-center">
            <FaArrowLeft className="mr-2" /> Back to Profile
          </Link>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#1A1A1A] rounded-lg border border-[#333333] overflow-hidden">
                <div className="p-4 bg-[#111111] border-b border-[#333333] flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-400">Order #{order.id}</span>
                    <p className="text-sm text-gray-400">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gold-foil font-bold">${order.total.toFixed(2)}</span>
                    <span
                      className={`ml-4 px-3 py-1 rounded-full text-xs ${
                        order.status === "Delivered"
                          ? "bg-emerald-green bg-opacity-20 text-emerald-green"
                          : order.status === "Processing"
                            ? "bg-citrus-orange bg-opacity-20 text-citrus-orange"
                            : "bg-[#333333] text-white"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.quantity} × {item.name}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#333333] flex justify-between">
                    <button className="text-gold-foil hover:underline">View Details</button>
                    <button className="text-gold-foil hover:underline">Reorder</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1A1A1A] rounded-lg border border-[#333333] p-8 text-center">
            <div className="w-16 h-16 bg-[#222222] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHistory className="text-gray-500 text-2xl" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Orders Yet</h2>
            <p className="text-gray-400 mb-6">You haven't placed any orders yet.</p>
            <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
              <FaShoppingBag /> Browse Menu
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
