import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'
import { utcDayKey } from '@/lib/daykey'
import { 
  getUserRewards, 
  createUserRewards, 
  updateUserRewards,
  addPointsTransaction
} from '@/lib/services/rewardsService'
import { db } from '@/lib/services/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// New spin wheel configuration with updated probabilities
const SPIN_WHEEL_CONFIG = {
  outcomes: [
    { points: 5, probability: 0.30, label: '5 Points' },
    { points: 10, probability: 0.30, label: '10 Points' },
    { points: 20, probability: 0.25, label: '20 Points' },
    { points: 25, probability: 0.13, label: '25 Points' },
    { points: 50, probability: 0.02, label: '50 Points - JACKPOT!' }
  ],
  cooldownHours: 24
}

// Execute spin with new probabilities
function executeSpin() {
  const random = Math.random()
  let cumulativeProbability = 0
  
  for (const outcome of SPIN_WHEEL_CONFIG.outcomes) {
    cumulativeProbability += outcome.probability
    if (random <= cumulativeProbability) {
      return {
        result: outcome.label,
        pointsAwarded: outcome.points,
        isJackpot: outcome.points === 50
      }
    }
  }
  
  // Fallback to lowest reward
  return {
    result: '5 Points',
    pointsAwarded: 5,
    isJackpot: false
  }
}

// Check if user has already spun today using UTC dayKey
async function hasSpunToday(userId: string): Promise<boolean> {
  try {
    const dayKey = utcDayKey()
    const spinDocId = `spin_${userId}_${dayKey}`
    const spinDoc = await getDoc(doc(db, 'SpinLedger', spinDocId))
    return spinDoc.exists()
  } catch (error) {
    console.error('Error checking spin status:', error)
    return true // Fail safe - assume already spun
  }
}

export async function POST(req: Request) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
    }
    
    const userId = user.uid
    const dayKey = utcDayKey()
    
    // Check if user has already spun today
    if (await hasSpunToday(userId)) {
      const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
      return new NextResponse(JSON.stringify({
        success: false,
        error: 'SPIN_USED',
        nextResetUTC: '00:00'
      }), { status: 429, headers })
    }
    
    // Get user's rewards profile
    let userRewards = await getUserRewards(userId)
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    // Execute the spin
    const spinResult = executeSpin()
    
    // Calculate new points balance
    const newBalance = userRewards.totalPoints + spinResult.pointsAwarded
    
    // Record spin in SpinLedger
    const spinDocId = `spin_${userId}_${dayKey}`
    const spinLedgerData = {
      awardedPoints: spinResult.pointsAwarded,
      createdAt: serverTimestamp(),
      dayKey,
      userId,
      result: spinResult.result,
      isJackpot: spinResult.isJackpot
    }
    
    await setDoc(doc(db, 'SpinLedger', spinDocId), spinLedgerData)
    
    // Update user rewards
    const updatedRewards = {
      ...userRewards,
      totalPoints: newBalance,
      lastSpinDate: new Date(),
      spinCount: (userRewards.spinCount || 0) + 1
    }
    
    await updateUserRewards(userId, updatedRewards)
    
    // Create points transaction record
    await addPointsTransaction({
      userId,
      type: 'bonus',
      amount: spinResult.pointsAwarded,
      description: `Daily spin: ${spinResult.result}`,
      metadata: {
        spinResult: spinResult.result,
        isJackpot: spinResult.isJackpot,
        source: 'daily_spin',
        dayKey
      }
    })
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    return new NextResponse(JSON.stringify({
      success: true,
      result: spinResult.result,
      pointsAwarded: spinResult.pointsAwarded,
      newBalance,
      isJackpot: spinResult.isJackpot
    }), { status: 200, headers })
    
  } catch (error) {
    console.error('Spin error:', error)
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
    }
    
    const userId = user.uid
    
    // Get user's rewards profile
    let userRewards = await getUserRewards(userId)
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    // Check if user can spin today
    const canSpin = !(await hasSpunToday(userId))
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    return new NextResponse(JSON.stringify({
      success: true,
      canSpin,
      currentPoints: userRewards.totalPoints,
      nextResetUTC: canSpin ? null : '00:00',
      wheelConfig: SPIN_WHEEL_CONFIG,
      cooldownHours: SPIN_WHEEL_CONFIG.cooldownHours
    }), { status: 200, headers })
    
  } catch (error) {
    console.error('Spin status error:', error)
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'