'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { useRole } from '@/context/RoleContext'
import { useAdminApiData } from '@/hooks/useAdminApiData'
import { Loader2 } from 'lucide-react'
import useSWR from 'swr'
import { onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { COLLECTIONS } from '@/lib/firebase/collections'

export default function AdminPage() {
  const role = useRole()
  const router = useRouter()
  const { data: adminData, loading: dataLoading, error: dataError, refetch } = useAdminApiData()
  
  // Real-time metrics with SWR
  const { data: metricsData, mutate } = useSWR(
    '/api/admin/metrics',
    (url: string) => fetch(url).then(r => r.json()),
    { refreshInterval: 5000 }
  )
  
  // Real-time Firestore listener for orders
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('createdAt', '>=', Timestamp.fromDate(today))
    )
    
    const unsubscribe = onSnapshot(ordersQuery, () => {
      mutate() // Trigger SWR revalidation when orders change
      refetch() // Refresh admin hook data
    })
    
    return unsubscribe
  }, [mutate, refetch])

  if (role === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#FFD700]" />
          <p className="text-white">Loading permissions…</p>
        </div>
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Access denied.</p>
        </div>
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#FFD700]" />
          <p className="text-white">Loading admin dashboard...</p>
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
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <AdminDashboard data={adminData} refetch={refetch} metricsData={metricsData} />
    </main>
  )
}