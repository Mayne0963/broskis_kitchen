'use client'

import { db, isFirebaseConfigured } from '@/lib/firebase/client'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'

export interface OrderMetric {
  id: string
  total: number
  createdAt: Date
}

export interface UserMetric {
  id: string
  createdAt: Date
}

export interface RedemptionMetric {
  id: string
  userId: string
  redeemedAt: Date
}

export interface RealTimeMetrics {
  orders: OrderMetric[]
  revenue: number
  signUps: UserMetric[]
  rewardRedemptions: RedemptionMetric[]
}

type MetricsCallback = (metrics: RealTimeMetrics) => void
export type ErrorCallback = (error: string) => void

class RealTimeAnalyticsService {
  private listeners: Array<() => void> = []
  private currentMetrics: RealTimeMetrics | null = null
  private subscribers: MetricsCallback[] = []
  private errorSubscribers: ErrorCallback[] = []

  subscribe(callback: MetricsCallback, errorCallback?: ErrorCallback): () => void {
    this.subscribers.push(callback)
    if (errorCallback) this.errorSubscribers.push(errorCallback)

    if (this.currentMetrics) callback(this.currentMetrics)

    if (this.subscribers.length === 1) this.startListening()

    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
      if (errorCallback) {
        this.errorSubscribers = this.errorSubscribers.filter(sub => sub !== errorCallback)
      }
      if (this.subscribers.length === 0) this.stopListening()
    }
  }

  private startListening() {
    if (!isFirebaseConfigured || !db) {
      this.currentMetrics = this.getMockMetrics()
      this.notifySubscribers()
      return
    }

    try {
      this.setupOrdersListener() 
      this.setupUsersListener() 
      this.setupRewardsListener()
      } catch (err) {
      console.error('Error starting real-time listeners:', err)
      this.notifyErrorSubscribers('Failed to start real-time analytics')
    }
  }

  private stopListening() {
    this.listeners.forEach(unsub => unsub())
    this.listeners = []
    this.currentMetrics = null
  }

  private setupOrdersListener() {
    if (!db) {
      console.error('Firebase not configured')
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsubscribe = onSnapshot(
      ordersQuery,
      snapshot => {
        const orders: OrderMetric[] = []
        let revenue = 0
        snapshot.docs.forEach(doc => {
          const data: any = doc.data()
          const total = data.pricing?.total || 0
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          orders.push({ id: doc.id, total, createdAt })
          revenue += total
        })
        this.updateMetrics({ orders, revenue })
      },
      error => {
        console.error('Error listening to orders:', error)
        this.notifyErrorSubscribers('Failed to listen to order updates')
      }
    )

    this.listeners.push(unsubscribe)
  }

  private setupUsersListener() {
    if (!db) {
      console.error('Firebase not configured')
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const usersQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsubscribe = onSnapshot(
      usersQuery,
      snapshot => {
        const users: UserMetric[] = snapshot.docs.map(doc => {
          const data: any = doc.data()
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          return { id: doc.id, createdAt }
        })
        this.updateMetrics({ signUps: users })
      },
      error => {
        console.error('Error listening to users:', error)
        this.notifyErrorSubscribers('Failed to listen to user updates')
      }
    )

    this.listeners.push(unsubscribe)
  }

  private updateMetrics(partial: Partial<RealTimeMetrics>) {
    if (!this.currentMetrics) {
      this.currentMetrics = { orders: [], revenue: 0, signUps: [], rewardRedemptions: [] }
    }
    this.currentMetrics = { ...this.currentMetrics, ...partial }
    this.notifySubscribers()
  }

  private notifySubscribers() {
    if (!this.currentMetrics) return
    this.subscribers.forEach(cb => {
      try {
        cb(this.currentMetrics!)
      } catch (err) {
        console.error('Error notifying subscriber:', err)
      }
    })
  }

  private notifyErrorSubscribers(error: string) {
    this.errorSubscribers.forEach(cb => {
      try {
        cb(error)
      } catch (err) {
        console.error('Error notifying error subscriber:', err)
      }
    })
  }

  getCurrentMetrics(): RealTimeMetrics | null {
    return this.currentMetrics
  }

  async refreshMetrics() {
    if (!isFirebaseConfigured || !db) {
      this.currentMetrics = this.getMockMetrics()
      this.notifySubscribers()
    }
    // if Firebase is configured, onSnapshot listeners already keep data fresh
  }
  private getMockMetrics(): RealTimeMetrics {
    const now = new Date()
    return {
      orders: [
        { id: 'order1', total: 25.5, createdAt: now },
        { id: 'order2', total: 40, createdAt: new Date(now.getTime() - 5 * 60 * 1000) }
      ],
      revenue: 65.5,
      signUps: [
        { id: 'user1', createdAt: now },
        { id: 'user2', createdAt: new Date(now.getTime() - 10 * 60 * 1000) }
      ],
      rewardRedemptions: [
        { id: 'reward1', userId: 'user2', redeemedAt: new Date(now.getTime() - 15 * 60 * 1000) }
      ]
    }
  }
}

export const realTimeAnalyticsService = new RealTimeAnalyticsService()

export default realTimeAnalyticsService