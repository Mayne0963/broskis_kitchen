'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { db, isFirebaseConfigured } from '@/lib/firebase/client'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs
} from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { Order } from '@/types/order'
import { getRewardsAnalytics } from '@/lib/services/rewardsService'
import { getUserAnalytics, getUserActivity } from '@/lib/services/userAnalyticsService'
import { useRole } from '@/context/RoleContext'

interface AdminStats {
  totalOrders: number
  totalRevenue: number
  activeMenuDrops: number
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  userGrowthRate: number
  rewardsRedeemed: number
  averageOrderValue: number
  averageOrdersPerUser: number
  retentionRate: number
}

interface MenuDrop {
  id: string
  name: string
  status: 'active' | 'scheduled' | 'ended'
  startTime: Date
  endTime: Date
  totalQuantity: number
  soldQuantity: number
  revenue: number
}

interface RewardsData {
  totalPointsIssued: number
  totalPointsRedeemed: number
  activeOffers: number
  totalRedemptions: number
  topRedemptions: Array<{
    offer: string
    count: number
    points: number
  }>
}

interface AdminData {
  stats: AdminStats
  recentOrders: Order[]
  menuDrops: MenuDrop[]
  rewardsData: RewardsData
  userAnalytics: {
    topCustomers: Array<{
      id: string
      name: string
      email: string
      totalOrders: number
      totalSpent: number
      lastOrderDate: Date
    }>
    usersByLocation: Array<{
      city: string
      state: string
      count: number
    }>
    userRegistrationTrend: Array<{
      date: string
      count: number
    }>
  }
  userActivity: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
    averageSessionDuration: number
    bounceRate: number
  }
}

export const useAdminData = () => {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const role = useRole()
  const unsubRef = useRef<() => void>(() => {})

  // Calculate stats from orders and user analytics
  const calculateStats = useCallback((orders: Order[], userAnalytics: any, userActivity: any): AdminStats => {
    const totalOrders = orders.length
    const totalRevenue = orders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total, 0)
    
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    return {
      totalOrders,
      totalRevenue,
      activeMenuDrops: 0, // Will be updated from menu drops data
      totalUsers: userAnalytics?.totalUsers || 0,
      activeUsers: userAnalytics?.activeUsers || 0,
      newUsersToday: userAnalytics?.newUsersToday || 0,
      newUsersThisWeek: userAnalytics?.newUsersThisWeek || 0,
      newUsersThisMonth: userAnalytics?.newUsersThisMonth || 0,
      userGrowthRate: userAnalytics?.userGrowthRate || 0,
      rewardsRedeemed: 0, // Will be fetched from rewards data
      averageOrderValue,
      averageOrdersPerUser: userAnalytics?.averageOrdersPerUser || 0,
      retentionRate: userActivity?.retentionRate || 0
    }
  }, [])

  // Fetch rewards analytics
  const fetchRewardsData = useCallback(async (): Promise<RewardsData> => {
    try {
      return await getRewardsAnalytics()
    } catch (error) {
      console.error('Error fetching rewards data:', error)
      return {
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        activeOffers: 0,
        totalRedemptions: 0,
        topRedemptions: []
      }
    }
  }, [])

  // Fetch and combine various pieces of data into final admin state
  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!db) {
        console.error('Firebase not configured')
        setLoading(false)
        return
      }

      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        orderBy('createdAt', 'desc'),
        limit(50)
      )

      // Note: menuDrops collection not defined in COLLECTIONS - removing for now
        // const menuDropsQuery = query(
        //   collection(db, 'menuDrops'),
        //   orderBy('startTime', 'desc')
        // )

      const [
        ordersSnapshot,
        menuDropsSnapshot,
        rewardsData,
        userAnalytics,
        userActivity
      ] = await Promise.all([
        getDocs(ordersQuery),
        getDocs(menuDropsQuery),
        fetchRewardsData(),
        getUserAnalytics(),
        getUserActivity()
      ])

      const ordersData: Order[] = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Order[]

      const menuDropsData: MenuDrop[] = menuDropsSnapshot.docs.map(doc => {
        const data = doc.data() as any
        return {
          id: doc.id,
          name: data.name,
          status: data.status,
          startTime: data.startTime?.toDate(),
          endTime: data.endTime?.toDate(),
          totalQuantity: data.totalQuantity || 0,
          soldQuantity: data.soldQuantity || 0,
          revenue: data.revenue || 0
        }
      })

      const stats = calculateStats(ordersData, userAnalytics, userActivity)
      stats.activeMenuDrops = menuDropsData.filter(drop => drop.status === 'active').length
      stats.rewardsRedeemed = rewardsData.totalRedemptions

      const recentOrders = ordersData.slice(0, 10)

      setData({
        stats,
        recentOrders,
        menuDrops: menuDropsData,
        rewardsData,
        userAnalytics: {
          topCustomers: userAnalytics.topCustomers,
          usersByLocation: userAnalytics.usersByLocation,
          userRegistrationTrend: userAnalytics.userRegistrationTrend
        },
        userActivity: {
          dailyActiveUsers: userActivity.dailyActiveUsers,
          weeklyActiveUsers: userActivity.weeklyActiveUsers,
          monthlyActiveUsers: userActivity.monthlyActiveUsers,
          averageSessionDuration: userActivity.averageSessionDuration,
          bounceRate: userActivity.bounceRate
        }
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError('Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }, [calculateStats, fetchRewardsData])

  // Set up real-time listeners for all data
  useEffect(() => {
    // Early exit if user is not an admin
    if (role !== 'admin') {
      setLoading(false)
      setError(role === null ? null : 'Access denied: Admin role required')
      return
    }

    if (!isFirebaseConfigured || !db) {
      // Use empty data if Firebase is not configured
      setData({
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          activeMenuDrops: 0,
          totalUsers: 0,
          activeUsers: 0,
          newUsersToday: 0,
          newUsersThisWeek: 0,
          newUsersThisMonth: 0,
          userGrowthRate: 0,
          rewardsRedeemed: 0,
          averageOrderValue: 0,
          averageOrdersPerUser: 0,
          retentionRate: 0
        },
        recentOrders: [],
        menuDrops: [],
        rewardsData: {
          totalPointsIssued: 0,
          totalPointsRedeemed: 0,
          activeOffers: 0,
          totalRedemptions: 0,
          topRedemptions: []
        },
        userAnalytics: {
          topCustomers: [],
          usersByLocation: [],
          userRegistrationTrend: []
        },
        userActivity: {
          dailyActiveUsers: 0,
          weeklyActiveUsers: 0,
          monthlyActiveUsers: 0,
          averageSessionDuration: 0,
          bounceRate: 0
        }
      })
      setLoading(false)
      return
    }

    const unsubscribers: (() => void)[] = []

    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    // Note: menuDrops and userRedemptions collections not defined in COLLECTIONS - removing for now
      // const menuDropsQuery = query(
      //   collection(db, 'menuDrops'),
      //   orderBy('startTime', 'desc')
      // )
      // const rewardsQuery = query(
      //   collection(db, 'userRedemptions'),
      //   orderBy('redeemedAt', 'desc'),
      //   limit(20)
      // )

    const ordersUnsubscribe = onSnapshot(
      ordersQuery,
      () => fetchAdminData(),
      error => {
        console.error('Error listening to orders:', error)
        setError('Failed to listen to real-time order updates')
      }
    )
    unsubscribers.push(ordersUnsubscribe)

    const menuDropsUnsubscribe = onSnapshot(
      menuDropsQuery,
      () => fetchAdminData(),
      error => {
        console.error('Error listening to menu drops:', error)
      }
    )
    unsubscribers.push(menuDropsUnsubscribe)

    const rewardsUnsubscribe = onSnapshot(
      rewardsQuery,
      () => fetchAdminData(),
      error => {
        console.error('Error listening to rewards:', error)
      }
    )
    unsubscribers.push(rewardsUnsubscribe)

    // Users listener
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      orderBy('createdAt', 'desc'),
      limit(10)
    )

    const usersUnsubscribe = onSnapshot(
      usersQuery,
      () => fetchAdminData(),
      error => {
        console.error('Error listening to users:', error)
      }
    )
    unsubscribers.push(usersUnsubscribe)

    // Initial data fetch
    fetchAdminData()

    // Cleanup function
    const cleanup = () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
    unsubRef.current = cleanup
    return cleanup
  }, [fetchAdminData, role])


  // Handle non-admin users
  if (role !== 'admin') {
    return {
      data: null,
      loading,
      error,
      refetch: () => Promise.resolve(),
      unsubscribe: () => {}
    }
  }

  return {
    data,
    loading,
    error,
    refetch: fetchAdminData,
    unsubscribe: unsubRef.current
  }
}