export const dynamic = 'force-dynamic';

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import KitchenDisplay from '@/components/kitchen/KitchenDisplay'
import { verifyKitchenAccess } from '@/lib/auth/rbac'
import { safeFetch } from '@/lib/utils/safeFetch'

// Mock function to fetch initial orders for kitchen
async function getKitchenOrders() {
  try {
    const response = await safeFetch(`${process.env.BASE_URL || 'https://broskiskitchen.com'}/api/orders?status=confirmed,preparing,ready`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders')
    }
    
    const data = await response.json()
    return data.orders || []
  } catch (error) {
    console.error('Error fetching kitchen orders:', error)
    return []
  }
}

export default async function KitchenPage() {
  // Verify kitchen access
  const verification = await verifyKitchenAccess()
  
  if (!verification.success) {
    redirect('/auth/login?next=/kitchen')
  }

  const initialOrders = await getKitchenOrders()

  return (
    <div className="min-h-screen bg-[var(--color-rich-black)] text-white">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="min-h-screen bg-[var(--color-rich-black)] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-foil mx-auto mb-4"></div>
              <p className="text-white">Loading kitchen display...</p>
            </div>
          </div>
        }>
          <KitchenDisplay initialOrders={initialOrders} />
        </Suspense>
      </div>
    </div>
  )
}