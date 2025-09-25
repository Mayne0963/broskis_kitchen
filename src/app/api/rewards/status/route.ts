import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'
import { 
  getUserRewards, 
  createUserRewards
} from '@/lib/services/rewardsService'
import { db } from '@/lib/services/firebase'
import { doc, getDoc, query, where, collection, getDocs, orderBy, limit } from 'firebase/firestore'

export const dynamic = 'force-dynamic';

// Tier thresholds based on total points earned
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3000
}

// Calculate user tier based on total points earned
function calculateTier(totalPointsEarned: number): string {
  if (totalPointsEarned >= TIER_THRESHOLDS.platinum) return 'platinum'
  if (totalPointsEarned >= TIER_THRESHOLDS.gold) return 'gold'
  if (totalPointsEarned >= TIER_THRESHOLDS.silver) return 'silver'
  return 'bronze'
}

// Get next tier and points needed
function getNextTierInfo(totalPointsEarned: number) {
  const currentTier = calculateTier(totalPointsEarned)
  
  switch (currentTier) {
    case 'bronze':
      return {
        nextTier: 'silver',
        pointsNeeded: TIER_THRESHOLDS.silver - totalPointsEarned,
        progress: totalPointsEarned / TIER_THRESHOLDS.silver
      }
    case 'silver':
      return {
        nextTier: 'gold',
        pointsNeeded: TIER_THRESHOLDS.gold - totalPointsEarned,
        progress: (totalPointsEarned - TIER_THRESHOLDS.silver) / (TIER_THRESHOLDS.gold - TIER_THRESHOLDS.silver)
      }
    case 'gold':
      return {
        nextTier: 'platinum',
        pointsNeeded: TIER_THRESHOLDS.platinum - totalPointsEarned,
        progress: (totalPointsEarned - TIER_THRESHOLDS.gold) / (TIER_THRESHOLDS.platinum - TIER_THRESHOLDS.gold)
      }
    case 'platinum':
      return {
        nextTier: null,
        pointsNeeded: 0,
        progress: 1
      }
    default:
      return {
        nextTier: 'silver',
        pointsNeeded: TIER_THRESHOLDS.silver,
        progress: 0
      }
  }
}

// Check if user can spin (24h cooldown)
async function canUserSpin(userId: string): Promise<{ canSpin: boolean, nextSpinTime?: Date }> {
  try {
    const spinHistoryQuery = query(
      collection(db, 'spinHistory'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
    
    const spinHistorySnapshot = await getDocs(spinHistoryQuery)
    
    if (spinHistorySnapshot.empty) {
      return { canSpin: true }
    }
    
    const lastSpin = spinHistorySnapshot.docs[0].data()
    const lastSpinTime = lastSpin.createdAt.toDate()
    const nextSpinTime = new Date(lastSpinTime.getTime() + (24 * 60 * 60 * 1000))
    
    return {
      canSpin: new Date() >= nextSpinTime,
      nextSpinTime
    }
  } catch (error) {
    console.error('Error checking spin availability:', error)
    return { canSpin: false }
  }
}

// Get points expiring in the next 7 days
async function getExpiringPoints(userId: string): Promise<{ pointsExpiring: number, expiryDate?: Date }> {
  try {
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    const transactionsQuery = query(
      collection(db, 'pointsTransactions'),
      where('userId', '==', userId),
      where('type', 'in', ['earned', 'bonus']),
      where('expiryDate', '<=', sevenDaysFromNow),
      where('expiryDate', '>', new Date()),
      orderBy('expiryDate', 'asc')
    )
    
    const transactionsSnapshot = await getDocs(transactionsQuery)
    
    if (transactionsSnapshot.empty) {
      return { pointsExpiring: 0 }
    }
    
    let pointsExpiring = 0
    let earliestExpiry: Date | undefined
    
    transactionsSnapshot.docs.forEach(doc => {
      const transaction = doc.data()
      pointsExpiring += transaction.amount
      
      if (!earliestExpiry || transaction.expiryDate.toDate() < earliestExpiry) {
        earliestExpiry = transaction.expiryDate.toDate()
      }
    })
    
    return {
      pointsExpiring,
      expiryDate: earliestExpiry
    }
  } catch (error) {
    console.error('Error getting expiring points:', error)
    return { pointsExpiring: 0 }
  }
}

// Get recent activity (last 10 transactions)
async function getRecentActivity(userId: string) {
  try {
    const transactionsQuery = query(
      collection(db, 'pointsTransactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
    
    const transactionsSnapshot = await getDocs(transactionsQuery)
    
    return transactionsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        type: data.type,
        amount: data.amount,
        description: data.description,
        createdAt: data.createdAt.toDate().toISOString(),
        metadata: data.metadata
      }
    })
  } catch (error) {
    console.error('Error getting recent activity:', error)
    return []
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' },
        { 
          status: 401,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
        }
      );
    }

    const userId = user.uid;
    
    // Get user rewards
    let userRewards = await getUserRewards(userId)
    
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    // Calculate tier information
    const totalPointsEarned = userRewards.totalPointsEarned || 0
    const currentTier = calculateTier(totalPointsEarned)
    const nextTierInfo = getNextTierInfo(totalPointsEarned)
    
    // Check spin availability
    const spinStatus = await canUserSpin(userId)
    
    // Get expiring points
    const expiringInfo = await getExpiringPoints(userId)
    
    // Get recent activity
    const recentActivity = await getRecentActivity(userId)
    
    // Calculate days since last activity
    const daysSinceLastActivity = userRewards.lastActivityDate 
      ? Math.floor((new Date().getTime() - userRewards.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
      : null
    
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        totalPoints: userRewards.totalPoints,
        totalPointsEarned,
        totalRedeemed: userRewards.totalRedeemed || 0,
        joinDate: userRewards.createdAt?.toISOString(),
        lastActivityDate: userRewards.lastActivityDate?.toISOString(),
        daysSinceLastActivity
      },
      tier: {
        current: currentTier,
        nextTier: nextTierInfo.nextTier,
        pointsNeeded: nextTierInfo.pointsNeeded,
        progress: nextTierInfo.progress,
        thresholds: TIER_THRESHOLDS
      },
      spin: {
        canSpin: spinStatus.canSpin,
        nextSpinTime: spinStatus.nextSpinTime?.toISOString() || null,
        cooldownHours: 24
      },
      expiry: {
        pointsExpiring: expiringInfo.pointsExpiring,
        nextExpiryDate: expiringInfo.expiryDate?.toISOString() || null,
        hasExpiringPoints: expiringInfo.pointsExpiring > 0
      },
      activity: {
        recent: recentActivity,
        totalTransactions: recentActivity.length
      },
      warnings: {
        pointsExpiringSoon: expiringInfo.pointsExpiring > 0,
        inactiveAccount: daysSinceLastActivity !== null && daysSinceLastActivity > 90,
        lowBalance: userRewards.totalPoints < 50
      }
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    });
    
  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL' },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
      }
    );
  }
}