'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { useAuth } from '@/lib/context/AuthContext'
import { Loader2 } from 'lucide-react'

// Mock function to fetch admin data
function getAdminData() {
  return {
    stats: {
      totalOrders: 1247,
      totalRevenue: 45678.90,
      activeMenuDrops: 3,
      totalUsers: 892,
      rewardsRedeemed: 156,
      averageOrderValue: 36.65
    },
    recentOrders: [
      {
        id: 'BK-1234567890',
        customerName: 'John Doe',
        items: ['Signature Burger', 'Fries'],
        total: 24.99,
        status: 'preparing',
        orderTime: new Date(Date.now() - 15 * 60 * 1000),
        estimatedReady: new Date(Date.now() + 10 * 60 * 1000)
      },
      {
        id: 'BK-1234567891',
        customerName: 'Jane Smith',
        items: ['Chicken Wings', 'Caesar Salad'],
        total: 32.50,
        status: 'ready',
        orderTime: new Date(Date.now() - 25 * 60 * 1000),
        estimatedReady: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        id: 'BK-1234567892',
        customerName: 'Mike Johnson',
        items: ['Pizza Margherita', 'Garlic Bread'],
        total: 28.75,
        status: 'delivered',
        orderTime: new Date(Date.now() - 45 * 60 * 1000),
        deliveredTime: new Date(Date.now() - 10 * 60 * 1000)
      }
    ],
    menuDrops: [
      {
        id: '1',
        name: 'Weekend BBQ Special',
        status: 'active',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 22 * 60 * 60 * 1000),
        totalQuantity: 50,
        soldQuantity: 23,
        revenue: 1150.00
      },
      {
        id: '2',
        name: 'Taco Tuesday Drop',
        status: 'scheduled',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        totalQuantity: 75,
        soldQuantity: 0,
        revenue: 0
      },
      {
        id: '3',
        name: 'Friday Fish Fry',
        status: 'ended',
        startTime: new Date(Date.now() - 72 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
        totalQuantity: 40,
        soldQuantity: 40,
        revenue: 1600.00
      }
    ],
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
    }
  }
}

export default function AdminPage() {
  const { user, loading, isAdmin, refreshUserToken } = useAuth()
  const router = useRouter()
  const [adminData, setAdminData] = useState(null)
  const [tokenRefreshed, setTokenRefreshed] = useState(false)

  useEffect(() => {
    if (!loading && user && !tokenRefreshed) {
      // Force token refresh to get latest claims
      refreshUserToken().then(() => {
        setTokenRefreshed(true)
      })
    }
  }, [user, loading, refreshUserToken, tokenRefreshed])

  useEffect(() => {
    if (!loading && tokenRefreshed) {
      if (!user) {
        router.push('/auth/login?redirect=/admin')
        return
      }
      
      if (!isAdmin) {
        console.log('User is not admin:', { user, isAdmin })
        router.push('/unauthorized')
        return
      }
      
      // Load admin data
      setAdminData(getAdminData())
    }
  }, [user, loading, isAdmin, router, tokenRefreshed])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">Please sign in with an admin account to access the dashboard.</p>
          <Link 
            href="/auth/login?redirect=/admin" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
          <p className="text-sm text-gray-500 mb-6">Current user: {user.email} (Role: {user.role || 'customer'})</p>
          <div className="space-x-4">
             <Link 
               href="/" 
               className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
             >
               Go Home
             </Link>
             <Link 
               href="/test-auth" 
               className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
             >
               Debug Auth
             </Link>
           </div>
        </div>
      </div>
    )
  }

  if (!adminData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AdminDashboard data={adminData} />
    </div>
  )
}