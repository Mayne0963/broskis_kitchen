"use client"

import React, { useState, useEffect } from 'react'
import { Search, Package, Clock, CheckCircle, Truck } from 'lucide-react'
import { guestOrderUtils } from '@/utils/guestOrderTracking'
import { safeFetch } from '@/lib/utils/safeFetch'

interface Order {
  id: string
  status: string
  total: number
  orderType: string
  items: any[]
  createdAt: string
  estimatedTime?: string
  contactInfo: {
    email: string
    phone: string
  }
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guestOrders, setGuestOrders] = useState<any[]>([])

  useEffect(() => {
    // Load guest orders from session storage
    if (guestOrderUtils.isClient()) {
      setGuestOrders(guestOrderUtils.getGuestOrders())
    }
  }, [])

  const handleTrackOrder = async () => {
    if (!orderId.trim() || !email.trim()) {
      setError('Please enter both Order ID and Email')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      // First check guest orders in session storage
      if (guestOrderUtils.isClient()) {
        const guestOrder = guestOrderUtils.getGuestOrder(orderId)
        if (guestOrder && guestOrder.email.toLowerCase() === email.toLowerCase()) {
          // Fetch full order details from API
          const response = await safeFetch(`/api/orders/${orderId}`)
          if (response.ok) {
            const { order: fullOrder } = await response.json()
            const sanitized = {
              id: String(fullOrder?.id || orderId),
              status: String(fullOrder?.status || 'pending'),
              total: typeof fullOrder?.total === 'number' ? fullOrder.total : Number(fullOrder?.total || 0),
              orderType: String(fullOrder?.orderType || 'pickup'),
              items: Array.isArray(fullOrder?.items) ? fullOrder.items : [],
              createdAt: String(fullOrder?.createdAt || new Date().toISOString()),
              estimatedTime: fullOrder?.estimatedTime,
              contactInfo: fullOrder?.contactInfo || { email: email, phone: '' },
            } as Order
            setOrder(sanitized)
            setLoading(false)
            return
          }
        }
      }

      // Fallback to API search
      const response = await safeFetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, email })
      })

      if (response.ok) {
        const { order } = await response.json()
        const sanitized = {
          id: String(order?.id || orderId),
          status: String(order?.status || 'pending'),
          total: typeof order?.total === 'number' ? order.total : Number(order?.total || 0),
          orderType: String(order?.orderType || 'pickup'),
          items: Array.isArray(order?.items) ? order.items : [],
          createdAt: String(order?.createdAt || new Date().toISOString()),
          estimatedTime: order?.estimatedTime,
          contactInfo: order?.contactInfo || { email: email, phone: '' },
        } as Order
        setOrder(sanitized)
      } else {
        const { error } = await response.json()
        setError(error || 'Order not found')
      }
    } catch (err) {
      setError('Failed to track order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'preparing':
        return <Package className="w-5 h-5 text-orange-500" />
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'out_for_delivery':
        return <Truck className="w-5 h-5 text-purple-500" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Received'
      case 'confirmed':
        return 'Order Confirmed'
      case 'preparing':
        return 'Being Prepared'
      case 'ready':
        return 'Ready for Pickup/Delivery'
      case 'out_for_delivery':
        return 'Out for Delivery'
      case 'delivered':
        return 'Delivered'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <TrackOrderErrorBoundary>
    <div className="min-h-screen bg-[var(--color-dark-charcoal)] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Track Your Order</h1>
          <p className="text-gray-400">Enter your order details to track your order status</p>
        </div>

        {/* Track Order Form */}
        <div className="bg-black/30 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Order ID</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter your order ID"
                className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
              />
            </div>
          </div>
          
          <button
            onClick={handleTrackOrder}
            disabled={loading}
            className="w-full bg-[var(--color-harvest-gold)] text-black font-semibold py-2 px-4 rounded-lg hover:bg-[var(--color-harvest-gold)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                Tracking...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Search className="w-4 h-4 mr-2" />
                Track Order
              </div>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        {order && (
          <div className="bg-black/30 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Order #{order.id}</h2>
              <div className="flex items-center">
                {getStatusIcon(order.status)}
                <span className="ml-2 text-white font-medium">{getStatusText(order.status)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Type:</span>
                    <span className="text-white capitalize">{order.orderType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Date:</span>
                    <span className="text-white">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white font-semibold">${order.total.toFixed(2)}</span>
                  </div>
                  {order.estimatedTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Time:</span>
                      <span className="text-white">{order.estimatedTime}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{order.contactInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white">{order.contactInfo.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Order Items</h3>
              <div className="space-y-2">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-600">
                    <div>
                      <span className="text-white font-medium">{item.name}</span>
                      {item.customizationText && (
                        <p className="text-gray-400 text-sm">{item.customizationText}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-white">x{item.quantity}</span>
                      <span className="text-gray-400 ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Guest Orders */}
        {guestOrders.length > 0 && !order && (
          <div className="bg-black/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Your Recent Orders</h2>
            <div className="space-y-3">
              {guestOrders.map((guestOrder) => (
                <div key={guestOrder.orderId} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <span className="text-white font-medium">Order #{guestOrder.orderId}</span>
                    <p className="text-gray-400 text-sm">{new Date(guestOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center mb-1">
                      {getStatusIcon(guestOrder.status)}
                      <span className="ml-2 text-white text-sm">{getStatusText(guestOrder.status)}</span>
                    </div>
                    <span className="text-gray-400 text-sm">${guestOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </TrackOrderErrorBoundary>
  )
}

class TrackOrderErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: any) {
    console.error('TrackOrder page error:', error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--color-dark-charcoal)] text-white flex items-center justify-center">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold mb-2">Unable to load order</h2>
            <p className="text-gray-400">Please refresh the page or try again later.</p>
          </div>
        </div>
      )
    }
    return this.props.children as any
  }
}