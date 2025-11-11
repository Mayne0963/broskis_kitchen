'use client'

// Use client-side Firebase for analytics fetched in hooks/components
import { db, isFirebaseConfigured } from '@/lib/firebase/client'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  startAfter,
  endBefore
} from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  userGrowthRate: number
  averageOrdersPerUser: number
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

export interface UserActivity {
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  averageSessionDuration: number
  bounceRate: number
  retentionRate: number
}

// Empty fallback data - no mock numbers
const emptyUserAnalytics: UserAnalytics = {
  totalUsers: 0,
  activeUsers: 0,
  newUsersToday: 0,
  newUsersThisWeek: 0,
  newUsersThisMonth: 0,
  userGrowthRate: 0,
  averageOrdersPerUser: 0,
  topCustomers: [],
  usersByLocation: [],
  userRegistrationTrend: []
}

const emptyUserActivity: UserActivity = {
  dailyActiveUsers: 0,
  weeklyActiveUsers: 0,
  monthlyActiveUsers: 0,
  averageSessionDuration: 0,
  bounceRate: 0,
  retentionRate: 0
}

/**
 * Get comprehensive user analytics
 */
export const getUserAnalytics = async (): Promise<UserAnalytics> => {
  if (!isFirebaseConfigured || !db) {
    return emptyUserAnalytics
  }

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get total users
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS))
    const totalUsers = usersSnapshot.size

    // Get new users today
    const newUsersTodayQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('createdAt', '>=', Timestamp.fromDate(today))
    )
    const newUsersTodaySnapshot = await getDocs(newUsersTodayQuery)
    const newUsersToday = newUsersTodaySnapshot.size

    // Get new users this week
    const newUsersWeekQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('createdAt', '>=', Timestamp.fromDate(weekAgo))
    )
    const newUsersWeekSnapshot = await getDocs(newUsersWeekQuery)
    const newUsersThisWeek = newUsersWeekSnapshot.size

    // Get new users this month
    const newUsersMonthQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('createdAt', '>=', Timestamp.fromDate(monthAgo))
    )
    const newUsersMonthSnapshot = await getDocs(newUsersMonthQuery)
    const newUsersThisMonth = newUsersMonthSnapshot.size

    // Get active users (users with orders in last 30 days)
    const activeUsersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('createdAt', '>=', Timestamp.fromDate(monthAgo))
    )
    const activeOrdersSnapshot = await getDocs(activeUsersQuery)
    const activeUserIds = new Set()
    activeOrdersSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.userId) {
        activeUserIds.add(data.userId)
      }
    })
    const activeUsers = activeUserIds.size

    // Calculate user growth rate
    const previousMonth = new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000)
    const previousMonthQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('createdAt', '>=', Timestamp.fromDate(previousMonth)),
      where('createdAt', '<', Timestamp.fromDate(monthAgo))
    )
    const previousMonthSnapshot = await getDocs(previousMonthQuery)
    const previousMonthUsers = previousMonthSnapshot.size
    const userGrowthRate = previousMonthUsers > 0 
      ? ((newUsersThisMonth - previousMonthUsers) / previousMonthUsers) * 100 
      : 0

    // Get all orders for calculations
    const ordersSnapshot = await getDocs(collection(db, COLLECTIONS.ORDERS))
    const ordersByUser: { [userId: string]: any[] } = {}
    const userSpending: { [userId: string]: number } = {}
    
    ordersSnapshot.forEach(doc => {
      const order = doc.data()
      if (order.userId) {
        if (!ordersByUser[order.userId]) {
          ordersByUser[order.userId] = []
          userSpending[order.userId] = 0
        }
        ordersByUser[order.userId].push(order)
        if (order.status !== 'cancelled') {
          userSpending[order.userId] += order.total || 0
        }
      }
    })

    // Calculate average orders per user
    const totalOrders = Object.values(ordersByUser).reduce((sum, orders) => sum + orders.length, 0)
    const averageOrdersPerUser = totalUsers > 0 ? totalOrders / totalUsers : 0

    // Get top customers
    const topCustomers = await getTopCustomers(userSpending, ordersByUser)

    // Get user registration trend (last 7 days)
    const userRegistrationTrend = await getUserRegistrationTrend()

    // Get users by location (empty for now as location data might not be available)
    const usersByLocation: Array<{city: string; state: string; count: number}> = []

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      userGrowthRate,
      averageOrdersPerUser,
      topCustomers,
      usersByLocation,
      userRegistrationTrend
    }
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return emptyUserAnalytics
  }
}

/**
 * Get user activity metrics
 */
export const getUserActivity = async (): Promise<UserActivity> => {
  if (!isFirebaseConfigured || !db) {
    return emptyUserActivity
  }

  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get daily active users (users with orders today)
    const dailyActiveQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('createdAt', '>=', Timestamp.fromDate(today))
    )
    const dailyActiveSnapshot = await getDocs(dailyActiveQuery)
    const dailyActiveUserIds = new Set()
    dailyActiveSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.userId) {
        dailyActiveUserIds.add(data.userId)
      }
    })
    const dailyActiveUsers = dailyActiveUserIds.size

    // Get weekly active users
    const weeklyActiveQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('createdAt', '>=', Timestamp.fromDate(weekAgo))
    )
    const weeklyActiveSnapshot = await getDocs(weeklyActiveQuery)
    const weeklyActiveUserIds = new Set()
    weeklyActiveSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.userId) {
        weeklyActiveUserIds.add(data.userId)
      }
    })
    const weeklyActiveUsers = weeklyActiveUserIds.size

    // Get monthly active users
    const monthlyActiveQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('createdAt', '>=', Timestamp.fromDate(monthAgo))
    )
    const monthlyActiveSnapshot = await getDocs(monthlyActiveQuery)
    const monthlyActiveUserIds = new Set()
    monthlyActiveSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.userId) {
        monthlyActiveUserIds.add(data.userId)
      }
    })
    const monthlyActiveUsers = monthlyActiveUserIds.size

    // Calculate retention rate (users who made orders in both this month and last month)
    const lastMonth = new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000)
    const lastMonthQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('createdAt', '>=', Timestamp.fromDate(lastMonth)),
      where('createdAt', '<', Timestamp.fromDate(monthAgo))
    )
    const lastMonthSnapshot = await getDocs(lastMonthQuery)
    const lastMonthUserIds = new Set()
    lastMonthSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.userId) {
        lastMonthUserIds.add(data.userId)
      }
    })

    const retainedUsers = Array.from(monthlyActiveUserIds).filter(userId => 
      lastMonthUserIds.has(userId)
    ).length
    const retentionRate = lastMonthUserIds.size > 0 ? retainedUsers / lastMonthUserIds.size : 0

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      averageSessionDuration: 0, // Would need session tracking
      bounceRate: 0, // Would need session tracking
      retentionRate
    }
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return emptyUserActivity
  }
}

/**
 * Get top customers by spending
 */
const getTopCustomers = async (
  userSpending: { [userId: string]: number },
  ordersByUser: { [userId: string]: any[] }
) => {
  try {
    // Sort users by total spending
    const sortedUsers = Object.entries(userSpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 customers

    const topCustomers = []
    
    for (const [userId, totalSpent] of sortedUsers) {
      try {
        // Get user details
        const userQuery = query(
          collection(db, COLLECTIONS.USERS),
          where('__name__', '==', userId)
        )
        const userSnapshot = await getDocs(userQuery)
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data()
          const userOrders = ordersByUser[userId] || []
          const lastOrder = userOrders.sort((a, b) => 
            b.createdAt?.toDate?.()?.getTime() - a.createdAt?.toDate?.()?.getTime()
          )[0]

          topCustomers.push({
            id: userId,
            name: userData.name || userData.displayName || 'Unknown User',
            email: userData.email || 'No email',
            totalOrders: userOrders.length,
            totalSpent,
            lastOrderDate: lastOrder?.createdAt?.toDate?.() || new Date()
          })
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error)
      }
    }

    return topCustomers
  } catch (error) {
    console.error('Error getting top customers:', error)
    return []
  }
}

/**
 * Get user registration trend for the last 7 days
 */
const getUserRegistrationTrend = async () => {
  try {
    const trend = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
      
      const dayQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('createdAt', '>=', Timestamp.fromDate(date)),
        where('createdAt', '<', Timestamp.fromDate(nextDate))
      )
      
      const daySnapshot = await getDocs(dayQuery)
      
      trend.push({
        date: date.toISOString().split('T')[0],
        count: daySnapshot.size
      })
    }
    
    return trend
  } catch (error) {
    console.error('Error getting user registration trend:', error)
    return []
  }
}

/**
 * Get total user count
 */
export const getTotalUserCount = async (): Promise<number> => {
  if (!isFirebaseConfigured || !db) {
    return 0
  }

  try {
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS))
    return usersSnapshot.size
  } catch (error) {
    console.error('Error fetching user count:', error)
    return 0
  }
}

/**
 * Get active user count (users with activity in last 30 days)
 */
export const getActiveUserCount = async (): Promise<number> => {
  if (!isFirebaseConfigured || !db) {
    return 0
  }

  try {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const activeUsersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('createdAt', '>=', Timestamp.fromDate(monthAgo))
    )
    
    const activeOrdersSnapshot = await getDocs(activeUsersQuery)
    const activeUserIds = new Set()
    
    activeOrdersSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.userId) {
        activeUserIds.add(data.userId)
      }
    })
    
    return activeUserIds.size
  } catch (error) {
    console.error('Error fetching active user count:', error)
    return 0
  }
}