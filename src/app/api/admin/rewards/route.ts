import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/adminOnly'
import { adb } from '@/lib/firebaseAdmin'
import { COLLECTIONS } from '@/lib/firebase/collections'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin(request)

    // Get rewards data from Firestore
    const [offersSnapshot, rewardTransactionsSnapshot] = await Promise.all([
      adb.collection(COLLECTIONS.OFFERS).limit(100).get(),
      adb.collection(COLLECTIONS.REWARD_TRANSACTIONS).limit(500).get()
    ])

    // Calculate rewards statistics
    const totalPointsIssued = rewardTransactionsSnapshot.docs.reduce((total, doc) => {
      const transaction = doc.data()
      return total + (transaction.type === 'earned' ? (transaction.points || 0) : 0)
    }, 0)

    const totalPointsRedeemed = rewardTransactionsSnapshot.docs.reduce((total, doc) => {
      const transaction = doc.data()
      return total + (transaction.type === 'redeemed' ? Math.abs(transaction.points || 0) : 0)
    }, 0)

    const activeOffers = offersSnapshot.docs.filter(doc => {
      const offer = doc.data()
      return offer.status === 'active'
    }).length

    const totalRedemptions = rewardTransactionsSnapshot.docs.filter(doc => {
      const transaction = doc.data()
      return transaction.type === 'redeemed'
    }).length

    // Get top redemptions
    const topRedemptions = rewardTransactionsSnapshot.docs
      .filter(doc => doc.data().type === 'redeemed')
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => Math.abs(b.points || 0) - Math.abs(a.points || 0))
      .slice(0, 5)

    const rewardsData = {
      totalPointsIssued,
      totalPointsRedeemed,
      activeOffers,
      totalRedemptions,
      topRedemptions
    }

    return NextResponse.json(rewardsData)
  } catch (error) {
    console.error('Error fetching rewards data:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch rewards data' },
      { status: 500 }
    )
  }
}