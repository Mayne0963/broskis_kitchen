"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { toast } from '@/hooks/use-toast'
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
      
      const orderId = await saveOrder(orderDataWithUser)
      
      // Get the created order to add to state
      const createdOrder = await getOrderById(orderId)
      if (createdOrder) {
        setOrders(prev => [createdOrder, ...prev])
        setCurrentOrder(createdOrder)
      }

      toast({
        title: 'Order placed successfully!',
        description: `Your order #${orderId} has been placed and is being processed.`,
        duration: 5000,
      })

      return orderId
    } catch (error) {
      console.error('Failed to create order:', error)
      setError('Failed to create order. Please try again.')
      
      toast({
        title: 'Order failed',
        description: 'There was an error placing your order. Please try again.',
        variant: 'destructive',
        duration: 5000,
      })
      
      throw error
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
      
      toast({
        title: 'Order updated',
        description: `Order #${orderId} status updated to ${status}`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update order status',
        variant: 'destructive',
        duration: 3000,
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
      const userOrders = await getUserOrders(userId || user?.id)
      setOrders(userOrders)
      return userOrders
    } catch (error) {
      console.error('Failed to get user orders:', error)
      return []
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
      
      toast({
        title: 'Order cancelled',
        description: `Order #${orderId} has been cancelled`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Failed to cancel order:', error)
      toast({
        title: 'Cancellation failed',
        description: 'Failed to cancel order',
        variant: 'destructive',
        duration: 3000,
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