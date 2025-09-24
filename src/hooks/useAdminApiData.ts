'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRole } from '@/context/RoleContext'

// API Response types based on technical architecture
interface OverviewMetrics {
  totalOrders: number
  totalRevenue: number
  activeUsers: number
  activeMenuDrops: number
  todayMetrics: {
    orders: number
    revenue: number
    newUsers: number
  }
  periodMetrics: {
    orders: number
    revenue: number
    newUsers: number
  }
  userStats: {
    total: number
    active: number
    newToday: number
    newThisWeek: number
    newThisMonth: number
  }
}

interface RewardsAnalytics {
  totalPointsIssued: number
  totalPointsRedeemed: number
  activeOffers: number
  totalRedemptions: number
  topRedemptions: Array<{
    offer: string
    count: number
    points: number
  }>
  recentTransactions: Array<{
    id: string
    userId: string
    points: number
    type: 'earned' | 'redeemed'
    description: string
    createdAt: string
  }>
}

interface MenuDropPerformance {
  totalDrops: number
  activeDrops: number
  totalRevenue: number
  averagePerformance: number
  drops: Array<{
    id: string
    name: string
    status: 'active' | 'scheduled' | 'ended'
    startTime: string
    endTime: string
    totalQuantity: number
    soldQuantity: number
    revenue: number
    performance: number
  }>
}

interface AdminApiData {
  overview: OverviewMetrics | null
  rewards: RewardsAnalytics | null
  menuDrops: MenuDropPerformance | null
}

interface UseAdminApiDataReturn {
  data: AdminApiData
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useAdminApiData = (): UseAdminApiDataReturn => {
  const [data, setData] = useState<AdminApiData>({
    overview: null,
    rewards: null,
    menuDrops: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const role = useRole()

  // Early return if user is not an admin or role is not available
  if (role !== 'admin') {
    return {
      data: { overview: null, rewards: null, menuDrops: null },
      loading: false,
      error: role === null ? null : 'Access denied: Admin role required',
      refetch: async () => {}
    }
  }

  const fetchOverviewData = useCallback(async (): Promise<OverviewMetrics | null> => {
    try {
      const response = await fetch('/api/admin/overview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch overview data: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching overview data:', error)
      return null
    }
  }, [])

  const fetchRewardsData = useCallback(async (): Promise<RewardsAnalytics | null> => {
    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch rewards data: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching rewards data:', error)
      return null
    }
  }, [])

  const fetchMenuDropsData = useCallback(async (): Promise<MenuDropPerformance | null> => {
    try {
      const response = await fetch('/api/admin/menu-drops', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch menu drops data: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching menu drops data:', error)
      return null
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [overview, rewards, menuDrops] = await Promise.all([
        fetchOverviewData(),
        fetchRewardsData(),
        fetchMenuDropsData()
      ])

      setData({
        overview,
        rewards,
        menuDrops
      })
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError('Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }, [fetchOverviewData, fetchRewardsData, fetchMenuDropsData])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  return {
    data,
    loading,
    error,
    refetch: fetchAllData
  }
}