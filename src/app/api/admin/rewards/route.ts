import { NextRequest, NextResponse } from 'next/server'
import { fastAdminGuard } from '@/lib/auth/fastGuard'
import { db } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const preferredRegion = ["iad1"]; // Co-locate near US East for admin traffic

export async function GET(request: NextRequest) {
  try {
    // Fast admin authentication guard
    const authResponse = await fastAdminGuard(request);
    if (authResponse) return authResponse;

    // Get rewards data from Firestore
    const [offersSnapshot, rewardTransactionsSnapshot] = await Promise.all([
      db.collection(COLLECTIONS.OFFERS).limit(100).get(),
      db.collection(COLLECTIONS.REWARD_TRANSACTIONS).limit(500).get()
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
      .sort((a: any, b: any) => Math.abs(b.points || 0) - Math.abs(a.points || 0))
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