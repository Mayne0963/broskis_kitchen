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

// NEW PROFIT LOGIC - Updated spin wheel configuration
const SPIN_WHEEL_CONFIG = {
  outcomes: [
    { points: 5, probability: 0.40, label: '5 Points' },
    { points: 10, probability: 0.30, label: '10 Points' },
    { points: 20, probability: 0.15, label: '20 Points' },
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
    
    // NEW PROFIT LOGIC - Block guest users
    if (user.isAnonymous) {
      return NextResponse.json({ success: false, error: 'GUESTS_BLOCKED' }, { status: 403 })
    }
    
    const userId = user.uid
    const dayKey = utcDayKey()
    
    // Parse request body for idempotency key
    const body = await req.json().catch(() => ({}))
    const { idempotencyKey } = body
    
    // Check for existing spin with same idempotency key
    if (idempotencyKey) {
      const existingSpin = await getDoc(doc(db, 'SpinLedger', idempotencyKey))
      if (existingSpin.exists()) {
        const spinData = existingSpin.data()
        return NextResponse.json({
          success: true,
          result: spinData.result,
          pointsAwarded: spinData.awardedPoints,
          newBalance: spinData.newBalance,
          isJackpot: spinData.isJackpot,
          cached: true
        })
      }
    }
    
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
    
    // NEW PROFIT LOGIC - Check spin cost based on user tier
    const isSenior = userRewards.isSenior || false
    const spinCost = isSenior ? 5 : 10 // Seniors pay 5 pts, regular users pay 10 pts
    
    if (userRewards.totalPoints < spinCost) {
      return NextResponse.json({ 
        success: false, 
        error: 'INSUFFICIENT_POINTS',
        required: spinCost,
        current: userRewards.totalPoints
      }, { status: 400 })
    }
    
    // Execute the spin
    const spinResult = executeSpin()
    
    // NEW PROFIT LOGIC - Calculate new points balance (deduct spin cost, add winnings)
    const newBalance = userRewards.totalPoints - spinCost + spinResult.pointsAwarded
    
    // Record spin in SpinLedger
    const spinDocId = idempotencyKey || `spin_${userId}_${dayKey}`
    const spinLedgerData = {
      awardedPoints: spinResult.pointsAwarded,
      createdAt: serverTimestamp(),
      dayKey,
      userId,
      result: spinResult.result,
      isJackpot: spinResult.isJackpot,
      newBalance,
      idempotencyKey
    }
    
    await setDoc(doc(db, 'SpinLedger', spinDocId), spinLedgerData)
    
    // Also create the daily spin record if using idempotency key
    if (idempotencyKey) {
      const dailySpinDocId = `spin_${userId}_${dayKey}`
      await setDoc(doc(db, 'SpinLedger', dailySpinDocId), {
        ...spinLedgerData,
        idempotencyRef: spinDocId
      })
    }
    
    // Update user rewards
    const updatedRewards = {
      ...userRewards,
      totalPoints: newBalance,
      lastSpinDate: new Date(),
      spinCount: (userRewards.spinCount || 0) + 1
    }
    
    await updateUserRewards(userId, updatedRewards)
    
    // NEW PROFIT LOGIC - Create transaction records for spin cost and winnings
    // Record spin cost deduction
    await addPointsTransaction({
      userId,
      type: 'redeemed',
      amount: -spinCost,
      description: `Spin cost (${isSenior ? 'Senior' : 'Regular'} rate)`,
      metadata: {
        source: 'spin_cost',
        isSenior,
        dayKey
      }
    })
    
    // Record spin winnings
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
    
    // NEW PROFIT LOGIC - Block guest users
    if (user.isAnonymous) {
      return NextResponse.json({ success: false, error: 'GUESTS_BLOCKED' }, { status: 403 })
    }
    
    const userId = user.uid
    
    // Get user's rewards profile
    let userRewards = await getUserRewards(userId)
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    // NEW PROFIT LOGIC - Calculate spin cost based on user tier
    const isSenior = userRewards.isSenior || false
    const spinCost = isSenior ? 5 : 10
    
    // Check if user can spin today
    const canSpin = !(await hasSpunToday(userId)) && userRewards.totalPoints >= spinCost
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    return new NextResponse(JSON.stringify({
      success: true,
      canSpin,
      currentPoints: userRewards.totalPoints,
      spinCost,
      isSenior,
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