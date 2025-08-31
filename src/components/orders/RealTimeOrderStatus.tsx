'use client'

import React, { useState, useEffect } from 'react'
import { Clock, CheckCircle, Truck, ChefHat, Package, AlertCircle } from 'lucide-react'
import { Order, OrderStatus } from '@/types/order'
import { db, isFirebaseConfigured } from '@/lib/services/firebase'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { useAuth } from '@/lib/context/AuthContext'

interface RealTimeOrderStatusProps {
  orderId: string
  onOrderUpdate?: (order: Order) => void
}

interface StatusStep {
  id: OrderStatus
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  completed: boolean
  active: boolean
}

export default function RealTimeOrderStatus({ orderId, onOrderUpdate }: RealTimeOrderStatusProps) {
  const { user, claims, isAuthenticated } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    if (!orderId) return

    let unsubscribe: (() => void) | null = null

    const setupRealtimeListener = async () => {
      try {
        if (isFirebaseConfigured && db && isAuthenticated && user) {
          // Set up Firebase real-time listener with authentication
          const q = query(
            collection(db, COLLECTIONS.ORDERS),
            where('id', '==', orderId)
          )

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              if (!snapshot.empty) {
                const orderDoc = snapshot.docs[0]
                const orderData = {
                  ...orderDoc.data(),
                  createdAt: orderDoc.data().createdAt?.toDate?.() || new Date(),
                  updatedAt: orderDoc.data().updatedAt?.toDate?.() || new Date(),
                } as Order
                
                // Verify user has permission to view this order
                if (orderData.userId === user.id || user.admin || user.role === 'admin') {
                  setOrder(orderData)
                  setLastUpdate(new Date())
                  onOrderUpdate?.(orderData)
                  setError(null)
                } else {
                  setError('Access denied to this order')
                }
              } else {
                setError('Order not found')
              }
              setLoading(false)
            },
            (err) => {
              console.error('Error listening to order updates:', err)
              setError('Failed to connect to real-time updates')
              setLoading(false)
              // Fallback to polling
              pollOrderStatus()
            }
          )
        } else {
          // Fallback to polling if Firebase is not configured or user not authenticated
          pollOrderStatus()
        }
      } catch (err) {
        console.error('Error setting up real-time listener:', err)
        setError('Failed to set up real-time updates')
        setLoading(false)
        pollOrderStatus()
      }
    }

    const pollOrderStatus = async () => {
      try {
        const response = await fetch(`/api/orders?orderId=${orderId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.orders && data.orders.length > 0) {
            const orderData = data.orders[0]
            setOrder(orderData)
            setLastUpdate(new Date())
            onOrderUpdate?.(orderData)
            setError(null)
          } else {
            setError('Order not found')
          }
        } else {
          setError('Failed to fetch order status')
        }
      } catch (err) {
        console.error('Error polling order status:', err)
        setError('Failed to fetch order status')
      } finally {
        setLoading(false)
      }
    }

    setupRealtimeListener()

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [orderId, onOrderUpdate])

  const getStatusSteps = (currentStatus: OrderStatus, orderType: 'delivery' | 'pickup'): StatusStep[] => {
    const statusOrder: OrderStatus[] = [
      'pending',
      'confirmed',
      'preparing',
      orderType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup',
      orderType === 'delivery' ? 'delivered' : 'completed'
    ]

    const currentIndex = statusOrder.indexOf(currentStatus)

    return statusOrder.map((status, index) => {
      let title = ''
      let description = ''
      let icon = Clock

      switch (status) {
        case 'pending':
          title = 'Order Received'
          description = 'We\'ve received your order'
          icon = Package
          break
        case 'confirmed':
          title = 'Order Confirmed'
          description = 'Payment processed successfully'
          icon = CheckCircle
          break
        case 'preparing':
          title = 'Preparing'
          description = 'Our chef is preparing your meal'
          icon = ChefHat
          break
        case 'out_for_delivery':
          title = 'Out for Delivery'
          description = 'Your order is on the way'
          icon = Truck
          break
        case 'ready_for_pickup':
          title = 'Ready for Pickup'
          description = 'Your order is ready for pickup'
          icon = Package
          break
        case 'delivered':
        case 'completed':
          title = orderType === 'delivery' ? 'Delivered' : 'Completed'
          description = orderType === 'delivery' ? 'Order delivered successfully' : 'Order completed'
          icon = CheckCircle
          break
        default:
          title = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
          description = 'Status update'
          icon = Clock
      }

      return {
        id: status,
        title,
        description,
        icon,
        completed: index < currentIndex || (index === currentIndex && currentStatus !== 'pending'),
        active: index === currentIndex
      }
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-harvest-gold)]"></div>
          <span className="ml-3 text-gray-400">Loading order status...</span>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-red-500/30">
        <div className="flex items-center text-red-400 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="font-medium">Unable to load order status</span>
        </div>
        <p className="text-red-300 text-sm">{error || 'Order not found'}</p>
      </div>
    )
  }

  const statusSteps = getStatusSteps(order.status, order.orderType)

  return (
    <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Order Status</h3>
        <div className="text-sm text-gray-400">
          Last updated: {formatTime(lastUpdate)}
        </div>
      </div>

      <div className="space-y-4">
        {statusSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="flex items-start space-x-4">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${
                  step.active
                    ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)] text-black'
                    : step.completed
                    ? 'border-[var(--color-harvest-gold)] bg-[var(--color-harvest-gold)] text-black'
                    : 'border-gray-600 text-gray-400'
                }
              `}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`
                  font-medium
                  ${
                    step.active || step.completed
                      ? 'text-[var(--color-harvest-gold)]'
                      : 'text-gray-400'
                  }
                `}>
                  {step.title}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {step.description}
                </div>
                {step.active && order.estimatedTime && (
                  <div className="text-sm text-[var(--color-harvest-gold)] mt-1">
                    Estimated: {order.estimatedTime}
                  </div>
                )}
              </div>
              
              {index < statusSteps.length - 1 && (
                <div className={`
                  absolute left-5 mt-10 w-0.5 h-8
                  ${
                    step.completed
                      ? 'bg-[var(--color-harvest-gold)]'
                      : 'bg-gray-600'
                  }
                `} style={{ marginLeft: '1.25rem' }} />
              )}
            </div>
          )
        })}
      </div>

      {order.specialInstructions && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Special Instructions</h4>
          <p className="text-sm text-gray-400">{order.specialInstructions}</p>
        </div>
      )}
    </div>
  )
}