import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleError } from '@/lib/error'
import { 
  getUserRewards, 
  createUserRewards, 
  updateUserRewards,
  addPointsTransaction
} from '@/lib/services/rewardsService'
import { db } from '@/lib/services/firebase'
import { doc, getDoc, setDoc, query, where, collection, getDocs, orderBy, limit } from 'firebase/firestore'

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
    const nextSpinTime = new Date(lastSpinTime.getTime() + (SPIN_WHEEL_CONFIG.cooldownHours * 60 * 60 * 1000))
    
    return {
      canSpin: new Date() >= nextSpinTime,
      nextSpinTime
    }
  } catch (error) {
    console.error('Error checking spin availability:', error)
    return { canSpin: false }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req)
    const userId = user.uid
    
    // Parse request body (optional idempotency key)
    const body = await req.json()
    const { idempotencyKey } = body
    
    // Get user's rewards profile
    let userRewards = await getUserRewards(userId)
    
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    // Check if user can spin (24h cooldown)
    const spinCheck = await canUserSpin(userId)
    if (!spinCheck.canSpin) {
      return NextResponse.json({
        success: false,
        error: 'Spin cooldown active - one spin per 24 hours',
        nextSpinTime: spinCheck.nextSpinTime?.toISOString()
      }, { status: 429 })
    }
    
    // No spin cost - spins are free but limited to once per day
    // This is bonus points only, not deducting from user balance
    
    // Check for existing spin with same idempotency key (if provided)
    if (idempotencyKey) {
      const existingSpin = await getDoc(doc(db, 'spinHistory', idempotencyKey))
      if (existingSpin.exists()) {
        const spinData = existingSpin.data()
        return NextResponse.json({
          success: true,
          result: spinData.result,
          pointsAwarded: spinData.pointsAwarded,
          newBalance: spinData.newBalance,
          isJackpot: spinData.isJackpot,
          cached: true
        })
      }
    }
    
    // Execute the spin
    const spinResult = executeSpin()
    
    // Calculate new points balance (adding bonus points)
    const newBalance = userRewards.totalPoints + spinResult.pointsAwarded
    
    // Update user rewards
    const updatedRewards = {
      ...userRewards,
      totalPoints: newBalance,
      lastSpinDate: new Date(),
      spinCount: (userRewards.spinCount || 0) + 1
    }
    
    await updateUserRewards(userId, updatedRewards)
    
    // Record spin in history
    const spinHistoryData = {
      userId,
      result: spinResult.result,
      pointsAwarded: spinResult.pointsAwarded,
      newBalance,
      isJackpot: spinResult.isJackpot,
      createdAt: new Date(),
      idempotencyKey
    }
    
    if (idempotencyKey) {
      await setDoc(doc(db, 'spinHistory', idempotencyKey), spinHistoryData)
    } else {
      const spinHistoryRef = doc(collection(db, 'spinHistory'))
      await setDoc(spinHistoryRef, spinHistoryData)
    }
    
    // Create points transaction record
    await addPointsTransaction({
      userId,
      type: 'bonus',
      amount: spinResult.pointsAwarded,
      description: `Daily spin: ${spinResult.result}`,
      metadata: {
        spinResult: spinResult.result,
        isJackpot: spinResult.isJackpot,
        source: 'daily_spin'
      }
    })
    
    const result = {
      result: spinResult.result,
      pointsAwarded: spinResult.pointsAwarded,
      newBalance,
      isJackpot: spinResult.isJackpot
    }
    
    return NextResponse.json({
      success: true,
      result: result.result,
      pointsAwarded: result.pointsAwarded,
      newBalance: result.newBalance,
      isJackpot: result.isJackpot
    })
    
  } catch (error) {
    console.error('Spin error:', error)
    const errorResponse = handleError(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')
    
    if (!sessionCookie) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // TODO: Verify session and get actual user ID
    const userId = 'mock-user-id' // Replace with actual user ID from session
    
    // Get user's rewards profile
    let userRewards = await getUserRewards(userId)
    
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    // Check if user can spin
    const spinCheck = await canUserSpin(userId)
    
    return NextResponse.json({
      success: true,
      canSpin: spinCheck.canSpin,
      currentPoints: userRewards.totalPoints,
      nextSpinTime: spinCheck.nextSpinTime?.toISOString() || null,
      wheelConfig: SPIN_WHEEL_CONFIG,
      cooldownHours: SPIN_WHEEL_CONFIG.cooldownHours
    })
    
  } catch (error) {
    console.error('Spin status error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get spin status'
    }, { status: 500 })
  }
}