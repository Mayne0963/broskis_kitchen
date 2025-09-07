"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { toast } from 'sonner'
import { Order, OrderStatus, OrderContextType } from '@/types/order'
import { 
  saveOrder, 
  getOrderById, 
  getUserOrders, 
  updateOrderStatus as updateOrderStatusService, 
  cancelOrder as cancelOrderService, 
  trackOrder as trackOrderService 
} from '@/lib/services/orderService'
import { useAuth } from './AuthContext'

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
}

interface OrderProviderProps {
  children: ReactNode
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Create a new order
  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      const orderDataWithUser = {
        ...orderData,
        userId: user?.id || 'anonymous'
      }
      
      // Use API endpoint for creating orders
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderDataWithUser),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.status}`)
      }
      
      const data = await response.json()
      const createdOrder = data.order
      
      if (createdOrder) {
        setOrders(prev => [createdOrder, ...prev])
        setCurrentOrder(createdOrder)
      }

      toast.success('Order placed successfully!', {
        description: `Your order #${createdOrder.id} has been placed and is being processed.`,
      })

      return createdOrder.id
    } catch (error) {
      console.error('Failed to create order:', error)
      setError('Failed to create order. Please try again.')
      
      // Fallback to direct service
      try {
        const orderDataWithUser = {
          ...orderData,
          userId: user?.id || 'anonymous'
        }
        
        const orderId = await saveOrder(orderDataWithUser)
        
        // Get the created order to add to state
        const createdOrder = await getOrderById(orderId)
        if (createdOrder) {
          setOrders(prev => [createdOrder, ...prev])
          setCurrentOrder(createdOrder)
        }

        toast.success('Order placed successfully!', {
          description: `Your order #${orderId} has been placed and is being processed.`,
        })

        return orderId
      } catch (fallbackError) {
        toast.error('Order failed', {
          description: 'There was an error placing your order. Please try again.',
        })
        
        throw fallbackError
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    try {
      await updateOrderStatusService(orderId, status)
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, updatedAt: new Date() }
          : order
      ))
      
      if (currentOrder?.id === orderId) {
        setCurrentOrder(prev => prev ? { ...prev, status, updatedAt: new Date() } : null)
      }
      
      toast.success('Order updated', {
        description: `Order #${orderId} status updated to ${status}`,
      })
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Update failed', {
        description: 'Failed to update order status',
      })
    }
  }

  // Get order by ID
  const getOrder = async (orderId: string): Promise<Order | null> => {
    try {
      return await getOrderById(orderId)
    } catch (error) {
      console.error('Failed to get order:', error)
      return null
    }
  }

  // Get user orders
  const getUserOrdersData = useCallback(async (userId?: string): Promise<Order[]> => {
    try {
      // Use API endpoint instead of direct Firebase service
      const targetUserId = userId || user?.id
      if (!targetUserId) return []
      
      const response = await fetch(`/api/orders?userId=${targetUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`)
      }
      
      const data = await response.json()
      const userOrders = data.orders || []
      setOrders(userOrders)
      return userOrders
    } catch (error) {
      console.error('Failed to get user orders:', error)
      // Fallback to service if API fails
      try {
        const userOrders = await getUserOrders(userId || user?.id)
        setOrders(userOrders)
        return userOrders
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        return []
      }
    }
  }, [user?.id])

  // Cancel order
  const cancelOrder = async (orderId: string): Promise<void> => {
    try {
      await cancelOrderService(orderId)
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' as OrderStatus, updatedAt: new Date() }
          : order
      ))
      
      if (currentOrder?.id === orderId) {
        setCurrentOrder(prev => prev ? { ...prev, status: 'cancelled' as OrderStatus, updatedAt: new Date() } : null)
      }
      
      toast.success('Order cancelled', {
        description: `Order #${orderId} has been cancelled`,
      })
    } catch (error) {
      console.error('Failed to cancel order:', error)
      toast.error('Cancellation failed', {
        description: 'Failed to cancel order',
      })
    }
  }

  // Track order
  const trackOrder = async (orderId: string): Promise<Order | null> => {
    try {
      const trackedOrder = await trackOrderService(orderId)
      
      if (trackedOrder) {
        // Update local state with latest tracking info
        setOrders(prev => prev.map(order => 
          order.id === orderId ? trackedOrder : order
        ))
        
        if (currentOrder?.id === orderId) {
          setCurrentOrder(trackedOrder)
        }
      }
      
      return trackedOrder
    } catch (error) {
      console.error('Failed to track order:', error)
      return null
    }
  }

  // Clear current order
  const clearCurrentOrder = () => {
    setCurrentOrder(null)
  }

  // Load user orders on mount and when user changes
  useEffect(() => {
    if (user) {
      getUserOrdersData(user.id)
    }
  }, [user, getUserOrdersData])
  
  const contextValue: OrderContextType = {
    currentOrder,
    orders,
    isLoading,
    error,
    createOrder,
    updateOrderStatus,
    getOrder,
    getUserOrders: getUserOrdersData,
    cancelOrder,
    trackOrder,
    clearCurrentOrder
  }

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  )
}