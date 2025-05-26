"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from '@/hooks/use-toast'
import { Order, OrderStatus, OrderContextType } from '@/types/order'
import { submitOrderToOTW } from '@/lib/services/otw-integration'

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

  // Generate unique order ID
  const generateOrderId = (): string => {
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 8)
    return `ORD-${timestamp}-${randomStr}`.toUpperCase()
  }

  // Calculate delivery fee based on order total and distance
  const calculateDeliveryFee = (subtotal: number, orderType: 'delivery' | 'pickup'): number => {
    if (orderType === 'pickup') return 0
    if (subtotal >= 50) return 0 // Free delivery over $50
    return 4.99 // Standard delivery fee
  }

  // Create a new order
  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      const orderId = generateOrderId()
      const deliveryFee = calculateDeliveryFee(orderData.subtotal, orderData.orderType)
      
      const newOrder: Order = {
        ...orderData,
        id: orderId,
        deliveryFee,
        total: orderData.subtotal + orderData.tax + deliveryFee,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // In a real app, this would be an API call
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Add to orders list
      setOrders(prev => [newOrder, ...prev])
      setCurrentOrder(newOrder)

      // Save to localStorage for persistence
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      savedOrders.unshift(newOrder)
      localStorage.setItem('orders', JSON.stringify(savedOrders))

      // Submit to OTW if it's a delivery order
      if (newOrder.orderType === 'delivery') {
        try {
          const otwResult = await submitOrderToOTW(newOrder)
          if (otwResult.success) {
            console.log('Order successfully submitted to OTW:', otwResult.otw_order_id)
            // Store OTW order ID for tracking
            const updatedOrder = { ...newOrder, otwOrderId: otwResult.otw_order_id }
            setCurrentOrder(updatedOrder)
            
            toast({
              title: "Order placed successfully!",
              description: `Your order #${orderId} has been confirmed and sent to OTW for delivery.`,
              duration: 5000,
            })
          } else {
            console.warn('Failed to submit order to OTW:', otwResult.error)
            toast({
              title: "Order placed successfully!",
              description: `Your order #${orderId} has been confirmed. Delivery will be handled internally.`,
              duration: 5000,
            })
          }
        } catch (error) {
          console.error('Error submitting to OTW:', error)
          toast({
            title: "Order placed successfully!",
            description: `Your order #${orderId} has been confirmed. Delivery will be handled internally.`,
            duration: 5000,
          })
        }
      } else {
        toast({
          title: "Order placed successfully!",
          description: `Your order #${orderId} has been confirmed for pickup.`,
          duration: 5000,
        })
      }

      return orderId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order'
      setError(errorMessage)
      toast({
        title: "Order failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status, updatedAt: new Date() }
          : order
      ))

      if (currentOrder?.id === orderId) {
        setCurrentOrder(prev => prev ? { ...prev, status, updatedAt: new Date() } : null)
      }

      // Update localStorage
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]')
      const updatedOrders = savedOrders.map((order: Order) => 
        order.id === orderId 
          ? { ...order, status, updatedAt: new Date().toISOString() }
          : order
      )
      localStorage.setItem('orders', JSON.stringify(updatedOrders))

      toast({
        title: "Order updated",
        description: `Order status changed to ${status}`,
        duration: 3000,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Get specific order
  const getOrder = async (orderId: string): Promise<Order | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300))

      const order = orders.find(o => o.id === orderId)
      if (!order) {
        // Try to find in localStorage
        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]')
        const savedOrder = savedOrders.find((o: Order) => o.id === orderId)
        return savedOrder || null
      }
      return order
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get order'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Get user orders
  const getUserOrders = async (userId?: string): Promise<Order[]> => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500))

      if (userId) {
        return orders.filter(order => order.userId === userId)
      }
      return orders
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get orders'
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel order
  const cancelOrder = async (orderId: string): Promise<void> => {
    await updateOrderStatus(orderId, 'cancelled')
  }

  // Track order (same as get order for now)
  const trackOrder = async (orderId: string): Promise<Order | null> => {
    return await getOrder(orderId)
  }

  // Clear current order
  const clearCurrentOrder = () => {
    setCurrentOrder(null)
  }

  // Load orders from localStorage on mount
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem('orders')
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders).map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        }))
        setOrders(parsedOrders)
      }
    } catch (err) {
      console.error('Failed to load orders from localStorage:', err)
    }
  }, [])

  const value: OrderContextType = {
    currentOrder,
    orders,
    isLoading,
    error,
    createOrder,
    updateOrderStatus,
    getOrder,
    getUserOrders,
    cancelOrder,
    trackOrder,
    clearCurrentOrder
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}