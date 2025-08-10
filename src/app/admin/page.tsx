'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { useAuth } from '@/lib/context/AuthContext'
import { useAdminData } from '@/hooks/useAdminData'
import { Loader2 } from 'lucide-react'

export default function AdminPage() {
  const { user, loading, isAdmin, refreshUserToken } = useAuth()
  const router = useRouter()
  const { data: adminData, loading: dataLoading, error: dataError, refetch } = useAdminData()
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
    }
  }, [user, loading, isAdmin, router, tokenRefreshed])

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#FFD700]" />
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Access Required</h1>
          <p className="text-gray-300 mb-6">Please sign in with an admin account to access the dashboard.</p>
          <Link 
            href="/auth/login?redirect=/admin" 
            className="bg-gradient-to-r from-[#B7985A] to-[#D2BA6A] hover:from-[#D2BA6A] hover:to-[#B7985A] text-black px-6 py-3 rounded-lg transition-all duration-300 font-semibold shadow-lg shadow-[#B7985A]/30"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-4">You don't have admin privileges.</p>
          <p className="text-sm text-gray-400 mb-6">Current user: {user.email} (Role: {user.role || 'customer'})</p>
          <div className="space-x-4">
             <Link 
               href="/" 
               className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border border-gray-600"
             >
               Go Home
             </Link>
             <Link 
               href="/test-auth" 
               className="bg-gradient-to-r from-[#B7985A] to-[#D2BA6A] hover:from-[#D2BA6A] hover:to-[#B7985A] text-black px-6 py-3 rounded-lg transition-all duration-300 font-semibold shadow-lg shadow-[#B7985A]/30"
             >
               Debug Auth
             </Link>
           </div>
        </div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading dashboard data: {dataError}</p>
          <button 
            onClick={refetch}
            className="bg-gradient-to-r from-[#B7985A] to-[#D2BA6A] hover:from-[#D2BA6A] hover:to-[#B7985A] text-black px-6 py-3 rounded-lg transition-all duration-300 font-semibold shadow-lg shadow-[#B7985A]/30"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!adminData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#FFD700]" />
          <p className="text-white">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AdminDashboard data={adminData} refetch={refetch} />
    </div>
  )
}