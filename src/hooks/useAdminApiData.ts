/**
 * Admin data hook using secure API endpoints
 * Replaces direct Firestore reads with authenticated API calls
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { useRole } from '@/context/RoleContext'
import { Order, User, RewardSummary, Coupon, Offer } from '@/types/firestore'

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

interface AdminApiData {
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

export const useAdminApiData = () => {
  const [data, setData] = useState<AdminApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, getIdToken } = useAuth()
  const role = useRole()

  // Early return if user is not an admin
  if (role !== 'admin') {
    return {
      data: null,
      loading: false,
      error: 'Access denied: Admin role required',
      refetch: () => Promise.resolve()
    }
  }

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error(`API request failed for ${url}:`, error)
      throw error
    }
  }, [getIdToken])

  // Fetch orders data
  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    const response = await makeAuthenticatedRequest('/api/admin/orders?limit=50&sort=createdAt&dir=desc')
    return response.data || []
  }, [makeAuthenticatedRequest])

  // Fetch users data
  const fetchUsers = useCallback(async (): Promise<User[]> => {
    const response = await makeAuthenticatedRequest('/api/admin/users?limit=100')
    return response.data || []
  }, [makeAuthenticatedRequest])

  // Fetch coupons data
  const fetchCoupons = useCallback(async (): Promise<Coupon[]> => {
    const response = await makeAuthenticatedRequest('/api/admin/coupons?limit=50')
    return response.data || []
  }, [makeAuthenticatedRequest])

  // Fetch offers data
  const fetchOffers = useCallback(async (): Promise<Offer[]> => {
    const response = await makeAuthenticatedRequest('/api/admin/offers?limit=50')
    return response.data || []
  }, [makeAuthenticatedRequest])

  // Calculate stats from fetched data
  const calculateStats = useCallback((orders: Order[], users: User[]): AdminStats => {
    const totalOrders = orders.length
    const totalRevenue = orders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total, 0)
    
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Calculate user metrics
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const newUsersToday = users.filter(user => {
      const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)
      return createdAt >= today
    }).length
    
    const newUsersThisWeek = users.filter(user => {
      const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)
      return createdAt >= weekAgo
    }).length
    
    const newUsersThisMonth = users.filter(user => {
      const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)
      return createdAt >= monthAgo
    }).length
    
    const averageOrdersPerUser = users.length > 0 ? totalOrders / users.length : 0
    
    return {
      totalOrders,
      totalRevenue,
      activeMenuDrops: 0, // Will be updated from menu drops data
      totalUsers: users.length,
      activeUsers: users.filter(user => user.roles?.admin !== true).length,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      userGrowthRate: newUsersThisMonth > 0 ? (newUsersThisMonth / users.length) * 100 : 0,
      rewardsRedeemed: 0, // Will be calculated from rewards data
      averageOrderValue,
      averageOrdersPerUser,
      retentionRate: 0.68 // Placeholder - would need more complex calculation
    }
  }, [])

  // Generate user analytics from users and orders data
  const generateUserAnalytics = useCallback((users: User[], orders: Order[]) => {
    // Calculate top customers
    const customerStats = new Map()
    
    orders.forEach(order => {
      const existing = customerStats.get(order.userId) || {
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: new Date(0)
      }
      
      customerStats.set(order.userId, {
        totalOrders: existing.totalOrders + 1,
        totalSpent: existing.totalSpent + order.total,
        lastOrderDate: new Date(Math.max(
          existing.lastOrderDate.getTime(),
          order.createdAt.toDate ? order.createdAt.toDate().getTime() : new Date(order.createdAt).getTime()
        ))
      })
    })
    
    const topCustomers = Array.from(customerStats.entries())
      .map(([userId, stats]) => {
        const user = users.find(u => u.uid === userId)
        return {
          id: userId,
          name: user?.displayName || 'Unknown User',
          email: user?.email || 'unknown@example.com',
          totalOrders: stats.totalOrders,
          totalSpent: stats.totalSpent,
          lastOrderDate: stats.lastOrderDate
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
    
    return {
      topCustomers,
      usersByLocation: [
        { city: 'New York', state: 'NY', count: Math.floor(users.length * 0.3) },
        { city: 'Los Angeles', state: 'CA', count: Math.floor(users.length * 0.25) },
        { city: 'Chicago', state: 'IL', count: Math.floor(users.length * 0.2) }
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
    }
  }, [])

  // Main data fetching function
  const fetchAdminData = useCallback(async () => {
    if (!user) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [orders, users, coupons, offers] = await Promise.all([
        fetchOrders(),
        fetchUsers(),
        fetchCoupons(),
        fetchOffers()
      ])

      // Calculate stats and analytics
      const stats = calculateStats(orders, users)
      const userAnalytics = generateUserAnalytics(users, orders)
      
      // Mock rewards data (would be fetched from rewards API)
      const rewardsData: RewardsData = {
        totalPointsIssued: users.reduce((sum, user) => sum + (user.rewardPoints || 0), 0) * 2,
        totalPointsRedeemed: users.reduce((sum, user) => sum + (user.rewardPoints || 0), 0),
        activeOffers: offers.filter(offer => offer.active).length,
        totalRedemptions: Math.floor(users.length * 0.3),
        topRedemptions: [
          { offer: 'Free Appetizer', count: 45, points: 22500 },
          { offer: 'Free Delivery', count: 67, points: 20100 },
          { offer: '20% Off Next Order', count: 28, points: 21000 }
        ]
      }
      
      stats.rewardsRedeemed = rewardsData.totalRedemptions
      
      // Mock menu drops data
      const menuDrops: MenuDrop[] = [
        {
          id: '1',
          name: 'Weekend Special',
          status: 'active',
          startTime: new Date(),
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          totalQuantity: 100,
          soldQuantity: 67,
          revenue: 2345.67
        }
      ]
      
      stats.activeMenuDrops = menuDrops.filter(drop => drop.status === 'active').length
      
      setData({
        stats,
        recentOrders: orders.slice(0, 10),
        menuDrops,
        rewardsData,
        userAnalytics,
        userActivity: {
          dailyActiveUsers: Math.floor(users.length * 0.15),
          weeklyActiveUsers: Math.floor(users.length * 0.4),
          monthlyActiveUsers: Math.floor(users.length * 0.8),
          averageSessionDuration: 8.5,
          bounceRate: 0.32
        }
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }, [user, fetchOrders, fetchUsers, fetchCoupons, fetchOffers, calculateStats, generateUserAnalytics])

  // Initial data fetch and setup polling
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchAdminData()
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchAdminData, 30000)
    
    return () => clearInterval(interval)
  }, [user, fetchAdminData])

  return {
    data,
    loading,
    error,
    refetch: fetchAdminData
  }
}