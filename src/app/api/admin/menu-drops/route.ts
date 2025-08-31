import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth/adminOnly'
import { adb } from '@/lib/firebaseAdmin'
import { COLLECTIONS } from '@/lib/firebase/collections'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Fetch menu drops data
    const menuDropsSnapshot = await adb.collection(COLLECTIONS.MENU_DROPS).limit(100).get()

    const menuDrops = menuDropsSnapshot.docs.map(doc => {
      const data = doc.data()
      const now = new Date()
      const startTime = data.startTime?.toDate() || new Date()
      const endTime = data.endTime?.toDate() || new Date()
      
      // Determine status based on current time
      let status: 'active' | 'scheduled' | 'ended'
      if (now < startTime) {
        status = 'scheduled'
      } else if (now >= startTime && now <= endTime) {
        status = 'active'
      } else {
        status = 'ended'
      }

      return {
        id: doc.id,
        name: data.name || 'Unnamed Drop',
        status,
        startTime,
        endTime,
        totalQuantity: data.totalQuantity || 0,
        soldQuantity: data.soldQuantity || 0,
        revenue: data.revenue || 0
      }
    })

    // Sort by start time (most recent first)
    menuDrops.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

    return NextResponse.json(menuDrops)
  } catch (error) {
    console.error('Error fetching menu drops data:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch menu drops data' },
      { status: 500 }
    )
  }
}