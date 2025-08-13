'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Order } from '@/types/order'
import { useAuth } from '@/lib/context/AuthContext'

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

  // Get auth token for API calls
  const { user } = useAuth()
  
  const getAuthHeaders = useCallback(async () => {
    if (!user) throw new Error('User not authenticated')
    const token = await user.getIdToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, [user])

  const unsubRef = useRef<() => void>(() => {})

  // Fetch and combine various pieces of data into final admin state using API endpoints
  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        setError('User not authenticated')
        return
      }

      const headers = await getAuthHeaders()

      const [
        ordersResponse,
        usersResponse,
        offersResponse,
        couponsResponse
      ] = await Promise.all([
        fetch('/api/admin/orders?limit=50&sort=createdAt&dir=desc', { headers }),
        fetch('/api/admin/users?limit=100', { headers }),
        fetch('/api/admin/offers', { headers }),
        fetch('/api/admin/coupons', { headers })
      ])

      if (!ordersResponse.ok || !usersResponse.ok || !offersResponse.ok || !couponsResponse.ok) {
        throw new Error('Failed to fetch admin data from API')
      }

      const [
        ordersData,
        usersData,
        offersData,
        couponsData
      ] = await Promise.all([
        ordersResponse.json(),
        usersResponse.json(),
        offersResponse.json(),
        couponsResponse.json()
      ])

      // Calculate stats from API data
      const orders = ordersData.orders || []
      const users = usersData.users || []
      const offers = offersData.offers || []
      const coupons = couponsData.coupons || []

      const totalOrders = orders.length
      const totalRevenue = orders
        .filter((order: any) => order.status !== 'cancelled')
        .reduce((sum: number, order: any) => sum + order.total, 0)
      
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      const activeOffers = offers.filter((offer: any) => offer.active).length
      const activeCoupons = coupons.filter((coupon: any) => coupon.isActive).length

      // Mock some analytics data that would come from separate analytics service
      const mockUserAnalytics = {
        topCustomers: users.slice(0, 5).map((user: any, index: number) => ({
          id: user.uid,
          name: user.displayName || 'Unknown User',
          email: user.email,
          totalOrders: Math.floor(Math.random() * 20) + 5,
          totalSpent: Math.floor(Math.random() * 1000) + 200,
          lastOrderDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        })),
        usersByLocation: [
          { city: 'New York', state: 'NY', count: Math.floor(users.length * 0.3) },
          { city: 'Los Angeles', state: 'CA', count: Math.floor(users.length * 0.25) },
          { city: 'Chicago', state: 'IL', count: Math.floor(users.length * 0.2) }
        ],
        userRegistrationTrend: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 15) + 5
        }))
      }

      const mockUserActivity = {
        dailyActiveUsers: Math.floor(users.length * 0.3),
        weeklyActiveUsers: Math.floor(users.length * 0.6),
        monthlyActiveUsers: users.length,
        averageSessionDuration: 8.5,
        bounceRate: 0.32
      }

      const mockRewardsData = {
        totalPointsIssued: orders.reduce((sum: number, order: any) => sum + (order.rewardPointsEarned || 0), 0),
        totalPointsRedeemed: orders.reduce((sum: number, order: any) => sum + (order.rewardPointsSpent || 0), 0),
        activeOffers,
        totalRedemptions: Math.floor(Math.random() * 200) + 50,
        topRedemptions: [
          { offer: 'Free Appetizer', count: 45, points: 22500 },
          { offer: 'Free Delivery', count: 67, points: 20100 },
          { offer: '20% Off Next Order', count: 28, points: 21000 }
        ]
      }

      const stats: AdminStats = {
        totalOrders,
        totalRevenue,
        activeMenuDrops: 0, // Would come from menu drops API
        totalUsers: users.length,
        activeUsers: mockUserActivity.dailyActiveUsers,
        newUsersToday: Math.floor(Math.random() * 10) + 2,
        newUsersThisWeek: Math.floor(Math.random() * 50) + 20,
        newUsersThisMonth: Math.floor(Math.random() * 150) + 80,
        userGrowthRate: 15.2,
        rewardsRedeemed: mockRewardsData.totalRedemptions,
        averageOrderValue,
        averageOrdersPerUser: totalOrders / Math.max(users.length, 1),
        retentionRate: 0.68
      }

      const recentOrders = orders.slice(0, 10)

      setData({
        stats,
        recentOrders,
        menuDrops: [], // Would come from menu drops API
        rewardsData: mockRewardsData,
        userAnalytics: mockUserAnalytics,
        userActivity: mockUserActivity
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError('Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }, [user, getAuthHeaders])

  // Set up data fetching with periodic refresh
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // Initial data fetch
    fetchAdminData()

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchAdminData()
    }, 30000)

    // Cleanup function
    const cleanup = () => {
      clearInterval(intervalId)
    }
    unsubRef.current = cleanup
    return cleanup
  }, [fetchAdminData, user])


  return {
    data,
    loading,
    error,
    refetch: fetchAdminData,
    unsubscribe: unsubRef.current
  }
}