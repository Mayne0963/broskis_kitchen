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

// COGS caps for different reward types (as percentage of order subtotal)
const COGS_CAPS = {
  'free_item': 0.15,      // 15% cap for free items
  'discount': 0.20,       // 20% cap for discounts
  'delivery_credit': 0.10, // 10% cap for delivery credits
  'merchandise': 0.25     // 25% cap for merchandise
}

// Maximum total COGS per order (8% of order subtotal)
const MAX_TOTAL_COGS_PERCENTAGE = 0.08

// Check if user has already redeemed a reward for this order
async function hasRedeemedForOrder(userId: string, orderId: string): Promise<boolean> {
  try {
    const redemptionQuery = query(
      collection(db, 'redemptions'),
      where('userId', '==', userId),
      where('orderId', '==', orderId),
      limit(1)
    )
    
    const redemptionSnapshot = await getDocs(redemptionQuery)
    return !redemptionSnapshot.empty
  } catch (error) {
    console.error('Error checking order redemption:', error)
    return false
  }
}

// Calculate COGS value for a reward
function calculateCOGS(rewardType: string, rewardValue: number, orderSubtotal: number): number {
  const capPercentage = COGS_CAPS[rewardType as keyof typeof COGS_CAPS] || 0.15
  const maxCOGS = orderSubtotal * capPercentage
  
  // For discounts, COGS is the discount amount
  // For free items, COGS is the item cost
  // For delivery credits, COGS is the credit amount
  // For merchandise, COGS is the wholesale cost
  
  return Math.min(rewardValue, maxCOGS)
}

// Validate COGS doesn't exceed 8% of order subtotal
function validateTotalCOGS(cogsValue: number, orderSubtotal: number): boolean {
  const maxTotalCOGS = orderSubtotal * MAX_TOTAL_COGS_PERCENTAGE
  return cogsValue <= maxTotalCOGS
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req)
    const userId = user.uid
    
    const body = await req.json()
    const { 
      rewardId, 
      orderId, 
      orderSubtotal, 
      rewardType, 
      rewardValue, 
      pointsCost,
      idempotencyKey 
    } = body
    
    // Validate required fields
    if (!rewardId || !orderId || !orderSubtotal || !rewardType || !rewardValue || !pointsCost) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: rewardId, orderId, orderSubtotal, rewardType, rewardValue, pointsCost'
      }, { status: 400 })
    }
    
    // Validate order subtotal is positive
    if (orderSubtotal <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Order subtotal must be positive'
      }, { status: 400 })
    }
    
    // Check for existing redemption with same idempotency key
    if (idempotencyKey) {
      const existingRedemption = await getDoc(doc(db, 'redemptions', idempotencyKey))
      if (existingRedemption.exists()) {
        const redemptionData = existingRedemption.data()
        return NextResponse.json({
          success: true,
          redemptionId: existingRedemption.id,
          pointsDeducted: redemptionData.pointsDeducted,
          newBalance: redemptionData.newBalance,
          cached: true
        })
      }
    }
    
    // Check one reward per order guardrail
    const hasExistingRedemption = await hasRedeemedForOrder(userId, orderId)
    if (hasExistingRedemption) {
      return NextResponse.json({
        success: false,
        error: 'Only one reward redemption allowed per order'
      }, { status: 400 })
    }
    
    // Calculate COGS for this reward
    const cogsValue = calculateCOGS(rewardType, rewardValue, orderSubtotal)
    
    // Validate COGS doesn't exceed 8% cap
    if (!validateTotalCOGS(cogsValue, orderSubtotal)) {
      return NextResponse.json({
        success: false,
        error: `Reward value exceeds COGS cap (${(MAX_TOTAL_COGS_PERCENTAGE * 100)}% of order subtotal)`,
        maxAllowedValue: orderSubtotal * MAX_TOTAL_COGS_PERCENTAGE
      }, { status: 400 })
    }
    
    // Get user rewards
    let userRewards = await getUserRewards(userId)
    
    if (!userRewards) {
      return NextResponse.json({
        success: false,
        error: 'User rewards profile not found'
      }, { status: 404 })
    }
    
    // Check if user has enough points
    if (userRewards.totalPoints < pointsCost) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient points',
        required: pointsCost,
        current: userRewards.totalPoints
      }, { status: 400 })
    }
    
    // Calculate new balance
    const newBalance = userRewards.totalPoints - pointsCost
    
    // Update user rewards
    const updatedRewards = {
      ...userRewards,
      totalPoints: newBalance,
      totalRedeemed: (userRewards.totalRedeemed || 0) + pointsCost,
      lastRedemptionDate: new Date()
    }
    
    await updateUserRewards(userId, updatedRewards)
    
    // Record redemption
    const redemptionData = {
      userId,
      rewardId,
      orderId,
      orderSubtotal,
      rewardType,
      rewardValue,
      pointsDeducted: pointsCost,
      cogsValue,
      newBalance,
      createdAt: new Date(),
      idempotencyKey,
      status: 'completed'
    }
    
    let redemptionId: string
    if (idempotencyKey) {
      await setDoc(doc(db, 'redemptions', idempotencyKey), redemptionData)
      redemptionId = idempotencyKey
    } else {
      const redemptionRef = doc(collection(db, 'redemptions'))
      await setDoc(redemptionRef, redemptionData)
      redemptionId = redemptionRef.id
    }
    
    // Create points transaction record
    await addPointsTransaction({
      userId,
      type: 'redemption',
      amount: -pointsCost,
      description: `Redeemed ${rewardType}: ${rewardValue}`,
      metadata: {
        redemptionId,
        rewardId,
        orderId,
        rewardType,
        rewardValue,
        cogsValue
      }
    })
    
    return NextResponse.json({
      success: true,
      redemptionId,
      pointsDeducted: pointsCost,
      newBalance,
      cogsValue,
      message: 'Reward redeemed successfully'
    })
    
  } catch (error) {
    console.error('Redemption error:', error)
    const errorResponse = handleError(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req)
    const userId = user.uid
    
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')
    
    // Get user redemption history
    const redemptionQuery = query(
      collection(db, 'redemptions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    const redemptionSnapshot = await getDocs(redemptionQuery)
    const redemptions = redemptionSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate().toISOString()
    }))
    
    // If orderId provided, check if user has redeemed for this order
    let hasRedeemedForThisOrder = false
    if (orderId) {
      hasRedeemedForThisOrder = await hasRedeemedForOrder(userId, orderId)
    }
    
    return NextResponse.json({
      success: true,
      redemptions,
      hasRedeemedForOrder: hasRedeemedForThisOrder,
      cogsLimits: COGS_CAPS,
      maxTotalCogsPercentage: MAX_TOTAL_COGS_PERCENTAGE
    })
    
  } catch (error) {
    console.error('Get redemptions error:', error)
    const errorResponse = handleError(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}