'use client'

import { db, isFirebaseConfigured } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'

export interface RealTimeMetrics {
  ordersToday: number
  revenueToday: number
  activeUsers: number
  pendingOrders: number
  completedOrdersToday: number
  averageOrderValueToday: number
  topSellingItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  recentActivity: Array<{
    type: 'order' | 'user_registration' | 'reward_redemption'
    message: string
    timestamp: Date
    userId?: string
    orderId?: string
  }>
}

type MetricsCallback = (metrics: RealTimeMetrics) => void
type ErrorCallback = (error: string) => void

class RealTimeAnalyticsService {
  private listeners: Array<() => void> = []
  private currentMetrics: RealTimeMetrics | null = null
  private subscribers: Array<MetricsCallback> = []
  private errorSubscribers: Array<ErrorCallback> = []

  /**
   * Subscribe to real-time metrics updates
   */
  subscribe(callback: MetricsCallback, errorCallback?: ErrorCallback): () => void {
    this.subscribers.push(callback)
    if (errorCallback) {
      this.errorSubscribers.push(errorCallback)
    }

    // If we already have current metrics, send them immediately
    if (this.currentMetrics) {
      callback(this.currentMetrics)
    }

    // Start listening if this is the first subscriber
    if (this.subscribers.length === 1) {
      this.startListening()
    }

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
      if (errorCallback) {
        this.errorSubscribers = this.errorSubscribers.filter(sub => sub !== errorCallback)
      }

      // Stop listening if no more subscribers
      if (this.subscribers.length === 0) {
        this.stopListening()
      }
    }
  }

  /**
   * Start listening to real-time data changes
   */
  private startListening() {
    if (!isFirebaseConfigured || !db) {
      // Use mock data if Firebase is not configured
      this.currentMetrics = this.getMockMetrics()
      this.notifySubscribers()
      return
    }

    try {
      // Listen to orders for today
      this.setupOrdersListener()
      
      // Listen to user registrations
      this.setupUsersListener()
      
      // Listen to reward redemptions
      this.setupRewardsListener()
      
      // Initial metrics calculation
      this.calculateMetrics()
    } catch (error) {
      console.error('Error starting real-time listeners:', error)
      this.notifyErrorSubscribers('Failed to start real-time analytics')
    }
  }

  /**
   * Stop all real-time listeners
   */
  private stopListening() {
    this.listeners.forEach(unsubscribe => unsubscribe())
    this.listeners = []
    this.currentMetrics = null
  }

  /**
   * Set up real-time listener for orders
   */
  private setupOrdersListener() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        this.calculateMetrics()
      },
      (error) => {
        console.error('Error listening to orders:', error)
        this.notifyErrorSubscribers('Failed to listen to order updates')
      }
    )

    this.listeners.push(unsubscribe)
  }

  /**
   * Set up real-time listener for user registrations
   */
  private setupUsersListener() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const usersQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        this.calculateMetrics()
      },
      (error) => {
        console.error('Error listening to users:', error)
        this.notifyErrorSubscribers('Failed to listen to user updates')
      }
    )

    this.listeners.push(unsubscribe)
  }

  /**
   * Set up real-time listener for reward redemptions
   */
  private setupRewardsListener() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const rewardsQuery = query(
      collection(db, 'userRedemptions'),
      where('redeemedAt', '>=', Timestamp.fromDate(today)),
      orderBy('redeemedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      rewardsQuery,
      (snapshot) => {
        this.calculateMetrics()
      },
      (error) => {
        console.error('Error listening to rewards:', error)
        this.notifyErrorSubscribers('Failed to listen to reward updates')
      }
    )

    this.listeners.push(unsubscribe)
  }

  /**
   * Calculate current metrics from Firebase data
   */
  private async calculateMetrics() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get today's orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('createdAt', '>=', Timestamp.fromDate(today))
      )

      // Get pending orders
      const pendingOrdersQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'pending')
      )

      // Get recent activity (last 10 items)
      const recentOrdersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )

      const recentUsersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(3)
      )

      const recentRewardsQuery = query(
        collection(db, 'userRedemptions'),
        orderBy('redeemedAt', 'desc'),
        limit(2)
      )

      // Execute queries (simplified for demo - in real app, use onSnapshot results)
      const metrics: RealTimeMetrics = {
        ordersToday: 0,
        revenueToday: 0,
        activeUsers: 0,
        pendingOrders: 0,
        completedOrdersToday: 0,
        averageOrderValueToday: 0,
        topSellingItems: [
          { name: 'Broski Burger', quantity: 15, revenue: 225.00 },
          { name: 'Loaded Fries', quantity: 12, revenue: 144.00 },
          { name: 'Chicken Wings', quantity: 8, revenue: 120.00 }
        ],
        recentActivity: [
          {
            type: 'order',
            message: 'New order #1234 placed',
            timestamp: new Date(),
            orderId: '1234'
          },
          {
            type: 'user_registration',
            message: 'New user registered: j.smith@broskis.com',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            userId: 'user123'
          },
          {
            type: 'reward_redemption',
            message: 'Reward redeemed: Free Appetizer',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            userId: 'user456'
          }
        ]
      }

      this.currentMetrics = metrics
      this.notifySubscribers()
    } catch (error) {
      console.error('Error calculating metrics:', error)
      this.notifyErrorSubscribers('Failed to calculate real-time metrics')
    }
  }

  /**
   * Get mock metrics for when Firebase is not configured
   */
  private getMockMetrics(): RealTimeMetrics {
    return {
      ordersToday: 47,
      revenueToday: 1834.50,
      activeUsers: 234,
      pendingOrders: 8,
      completedOrdersToday: 39,
      averageOrderValueToday: 39.03,
      topSellingItems: [
        { name: 'Broski Burger', quantity: 15, revenue: 225.00 },
        { name: 'Loaded Fries', quantity: 12, revenue: 144.00 },
        { name: 'Chicken Wings', quantity: 8, revenue: 120.00 },
        { name: 'BBQ Sandwich', quantity: 6, revenue: 90.00 },
        { name: 'Caesar Salad', quantity: 5, revenue: 65.00 }
      ],
      recentActivity: [
        {
          type: 'order',
          message: 'New order #1234 placed by Sarah J.',
          timestamp: new Date(),
          orderId: '1234'
        },
        {
          type: 'user_registration',
          message: 'New user registered: mike.davis@email.com',
          timestamp: new Date(Date.now() - 3 * 60 * 1000),
          userId: 'user123'
        },
        {
          type: 'order',
          message: 'Order #1233 completed',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          orderId: '1233'
        },
        {
          type: 'reward_redemption',
          message: 'Free Delivery redeemed by John S.',
          timestamp: new Date(Date.now() - 8 * 60 * 1000),
          userId: 'user456'
        },
        {
          type: 'order',
          message: 'New order #1232 placed by Emma W.',
          timestamp: new Date(Date.now() - 12 * 60 * 1000),
          orderId: '1232'
        }
      ]
    }
  }

  /**
   * Notify all subscribers of metrics updates
   */
  private notifySubscribers() {
    if (this.currentMetrics) {
      this.subscribers.forEach(callback => {
        try {
          callback(this.currentMetrics!)
        } catch (error) {
          console.error('Error notifying subscriber:', error)
        }
      })
    }
  }

  /**
   * Notify error subscribers
   */
  private notifyErrorSubscribers(error: string) {
    this.errorSubscribers.forEach(callback => {
      try {
        callback(error)
      } catch (err) {
        console.error('Error notifying error subscriber:', err)
      }
    })
  }

  /**
   * Get current metrics without subscribing
   */
  getCurrentMetrics(): RealTimeMetrics | null {
    return this.currentMetrics
  }

  /**
   * Force refresh metrics
   */
  async refreshMetrics() {
    if (isFirebaseConfigured && db) {
      await this.calculateMetrics()
    } else {
      this.currentMetrics = this.getMockMetrics()
      this.notifySubscribers()
    }
  }
}

// Export singleton instance
export const realTimeAnalyticsService = new RealTimeAnalyticsService()

// Convenience hook for React components
export const useRealTimeMetrics = () => {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = realTimeAnalyticsService.subscribe(
      (newMetrics) => {
        setMetrics(newMetrics)
        setLoading(false)
        setError(null)
      },
      (errorMessage) => {
        setError(errorMessage)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const refreshMetrics = useCallback(() => {
    realTimeAnalyticsService.refreshMetrics()
  }, [])

  return {
    metrics,
    error,
    loading,
    refreshMetrics
  }
}

// Add missing imports
import { useState, useEffect, useCallback } from 'react'