'use client'

import { useState, useEffect, useCallback } from 'react'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { Order } from '@/types/order'
import { getAllOrders } from '@/lib/services/orderService'
import { getAllMenuDrops } from '@/lib/services/menuDropsService'
import { getRewardsAnalytics } from '@/lib/services/rewardsService'
import { getUserAnalytics, getUserActivity, getTotalUserCount } from '@/lib/services/userAnalyticsService'

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

  // Fetch menu drops data
  const fetchMenuDrops = useCallback(async (): Promise<MenuDrop[]> => {
    try {
      if (!isFirebaseConfigured || !db) {
        return []
      }

      const q = query(
        collection(db, 'menuDrops'),
        orderBy('startTime', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const menuDrops: MenuDrop[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        menuDrops.push({
          id: doc.id,
          name: data.name,
          status: data.status,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
          totalQuantity: data.totalQuantity || 0,
          soldQuantity: data.soldQuantity || 0,
          revenue: data.revenue || 0
        })
      })
      
      return menuDrops
    } catch (error) {
      console.error('Error fetching menu drops:', error)
      return []
    }
  }, [])

  // Fetch rewards data
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



  // Fetch all admin data
  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [orders, menuDrops, rewardsData, userAnalytics, userActivity] = await Promise.all([
        getAllOrders(),
        fetchMenuDrops(),
        fetchRewardsData(),
        getUserAnalytics(),
        getUserActivity()
      ])

      // Calculate stats
      const stats = calculateStats(orders, userAnalytics, userActivity)
      stats.activeMenuDrops = menuDrops.filter(drop => drop.status === 'active').length
      stats.rewardsRedeemed = rewardsData.totalRedemptions

      // Get recent orders (last 10)
      const recentOrders = orders.slice(0, 10)

      setData({
        stats,
        recentOrders,
        menuDrops,
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
  }, [calculateStats, fetchMenuDrops, fetchRewardsData])

  // Set up real-time listeners for all data
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      // Use mock data if Firebase is not configured
      setData({
        stats: {
          totalOrders: 1247,
          totalRevenue: 45678.90,
          activeMenuDrops: 3,
          totalUsers: 892,
          activeUsers: 234,
          newUsersToday: 12,
          newUsersThisWeek: 67,
          newUsersThisMonth: 189,
          userGrowthRate: 15.2,
          rewardsRedeemed: 156,
          averageOrderValue: 36.65,
          averageOrdersPerUser: 3.4,
          retentionRate: 0.68
        },
        recentOrders: [],
        menuDrops: [],
        rewardsData: {
          totalPointsIssued: 125000,
          totalPointsRedeemed: 87500,
          activeOffers: 5,
          totalRedemptions: 234,
          topRedemptions: [
            { offer: 'Free Appetizer', count: 45, points: 22500 },
            { offer: 'Free Delivery', count: 67, points: 20100 },
            { offer: '20% Off Next Order', count: 28, points: 21000 }
          ]
        },
        userAnalytics: {
          topCustomers: [
            {
              id: '1',
              name: 'John Smith',
              email: 'j.smith@broskis.com',
              totalOrders: 24,
              totalSpent: 1250.00,
              lastOrderDate: new Date('2024-01-15')
            },
            {
              id: '2',
              name: 'Sarah Johnson',
              email: 's.johnson@broskis.com',
              totalOrders: 18,
              totalSpent: 980.50,
              lastOrderDate: new Date('2024-01-14')
            }
          ],
          usersByLocation: [
            { city: 'New York', state: 'NY', count: 156 },
            { city: 'Los Angeles', state: 'CA', count: 134 },
            { city: 'Chicago', state: 'IL', count: 98 }
          ],
          userRegistrationTrend: [
            { date: '2024-01-08', count: 8 },
            { date: '2024-01-09', count: 12 },
            { date: '2024-01-10', count: 15 },
            { date: '2024-01-11', count: 9 },
            { date: '2024-01-12', count: 18 },
            { date: '2024-01-13', count: 14 },
            { date: '2024-01-14', count: 11 }
          ]
        },
        userActivity: {
          dailyActiveUsers: 234,
          weeklyActiveUsers: 567,
          monthlyActiveUsers: 892,
          averageSessionDuration: 8.5,
          bounceRate: 0.32
        }
      })
      setLoading(false)
      return
    }

    const unsubscribers: (() => void)[] = []

    // Set up real-time listener for orders
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(50) // Limit for performance
    )

    const ordersUnsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        console.log('Orders updated, refreshing admin data...')
        fetchAdminData()
      },
      (error) => {
        console.error('Error listening to orders:', error)
        setError('Failed to listen to real-time order updates')
      }
    )
    unsubscribers.push(ordersUnsubscribe)

    // Set up real-time listener for menu drops
    const menuDropsQuery = query(
      collection(db, 'menuDrops'),
      orderBy('startTime', 'desc')
    )

    const menuDropsUnsubscribe = onSnapshot(
      menuDropsQuery,
      (snapshot) => {
        console.log('Menu drops updated, refreshing admin data...')
        fetchAdminData()
      },
      (error) => {
        console.error('Error listening to menu drops:', error)
      }
    )
    unsubscribers.push(menuDropsUnsubscribe)

    // Set up real-time listener for user rewards
    const rewardsQuery = query(
      collection(db, 'userRedemptions'),
      orderBy('redeemedAt', 'desc'),
      limit(20)
    )

    const rewardsUnsubscribe = onSnapshot(
      rewardsQuery,
      (snapshot) => {
        console.log('Rewards updated, refreshing admin data...')
        fetchAdminData()
      },
      (error) => {
        console.error('Error listening to rewards:', error)
      }
    )
    unsubscribers.push(rewardsUnsubscribe)

    // Set up real-time listener for user registrations
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )

    const usersUnsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        console.log('Users updated, refreshing admin data...')
        fetchAdminData()
      },
      (error) => {
        console.error('Error listening to users:', error)
      }
    )
    unsubscribers.push(usersUnsubscribe)

    // Initial data fetch
    fetchAdminData()

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [fetchAdminData])

  return {
    data,
    loading,
    error,
    refetch: fetchAdminData
  }
}