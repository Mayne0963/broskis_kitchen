"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "../../lib/context/AuthContext"
import { useOrder } from "../../lib/context/OrderContext"
import { FaHistory, FaShoppingBag, FaArrowLeft, FaClock, FaMapMarkerAlt, FaTruck } from "react-icons/fa"
import Link from "next/link"
import { useEffect } from "react"
import { Order } from "../../types/order"
import OTWTracker from "../../components/orders/OTWTracker"

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-emerald-green bg-opacity-20 text-emerald-green'
      case 'preparing':
      case 'ready':
        return 'bg-citrus-orange bg-opacity-20 text-citrus-orange'
      case 'out-for-delivery':
        return 'bg-blue-500 bg-opacity-20 text-blue-400'
      case 'cancelled':
        return 'bg-red-500 bg-opacity-20 text-red-400'
      default:
        return 'bg-[#333333] text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return <FaShoppingBag className="w-4 h-4" />
      case 'out-for-delivery':
        return <FaTruck className="w-4 h-4" />
      case 'preparing':
      case 'ready':
        return <FaClock className="w-4 h-4" />
      default:
        return <FaClock className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Order History</h1>
          <Link href="/profile" className="text-gold-foil hover:underline flex items-center">
            <FaArrowLeft className="mr-2" /> Back to Profile
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-foil"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#1A1A1A] rounded-lg border border-[#333333] overflow-hidden">
                <div className="p-4 bg-[#111111] border-b border-[#333333] flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-400">Order #{order.id.slice(-8)}</span>
                    <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      {order.orderType === 'delivery' ? (
                        <><FaTruck className="mr-1" /> Delivery</>
                      ) : (
                        <><FaMapMarkerAlt className="mr-1" /> Pickup</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gold-foil font-bold">${order.total.toFixed(2)}</span>
                    <span
                      className={`ml-4 px-3 py-1 rounded-full text-xs flex items-center ${getStatusColor(order.status)}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">
                        {order.status.replace('-', ' ')}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm">{item.name}</span>
                          <span className="text-xs text-gray-400 ml-2">x{item.quantity}</span>
                          {item.customizations && Object.keys(item.customizations).length > 0 && (
                            <span className="text-xs text-gray-500 ml-2">(customized)</span>
                          )}
                        </div>
                        <span className="text-sm text-gold-foil">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {order.specialInstructions && (
                    <div className="mt-4 pt-4 border-t border-[#333333]">
                      <p className="text-xs text-gray-400">Special Instructions:</p>
                      <p className="text-sm text-gray-300">{order.specialInstructions}</p>
                    </div>
                  )}
                  {order.estimatedTime && (
                    <div className="mt-2 flex items-center text-xs text-gray-400">
                      <FaClock className="mr-1" />
                      Estimated time: {order.estimatedTime}
                    </div>
                  )}
                  {/* OTW Tracking for delivery orders */}
                  {order.orderType === 'delivery' && order.otwOrderId && (
                    <div className="mt-4 pt-4 border-t border-[#333333]">
                      <OTWTracker order={order} />
                    </div>
                  )}
                  
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
