import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'
import { 
  getUserRewards, 
  createUserRewards, 
  updateUserRewards,
  addPointsTransaction
} from '@/lib/services/rewardsService'
import { db } from '@/lib/services/firebase'
import { doc, getDoc, setDoc, query, where, collection, getDocs, orderBy, limit } from 'firebase/firestore'

// Static rewards catalog - NEW PROFIT LOGIC
const REWARDS_CATALOG = [
  {
    id: 'free_side_100',
    name: 'Free Side',
    description: 'Get any side dish for free',
    pointsCost: 100,
    category: 'food',
    type: 'free_item',
    value: 'side_dish',
    maxCogsValue: 2.00, // Max COGS $2
    active: true
  },
  {
    id: 'free_dessert_150',
    name: 'Free Dessert',
    description: 'Get any dessert for free',
    pointsCost: 150,
    category: 'food',
    type: 'free_item',
    value: 'dessert',
    maxCogsValue: 4.00, // Max COGS $4
    active: true
  },
  {
    id: 'discount_10pct_300',
    name: '10% Off',
    description: 'Get 10% off food subtotal only',
    pointsCost: 300,
    category: 'discount',
    type: 'percentage_discount',
    value: 10,
    maxCogsValue: null, // No COGS cap for percentage discounts
    active: true
  },
  {
    id: 'hat_400',
    name: 'Broski Hat',
    description: 'Get a Broski branded hat',
    pointsCost: 400,
    category: 'merchandise',
    type: 'merchandise',
    value: 'hat',
    maxCogsValue: 8.00, // Max cost $8
    active: true
  },
  {
    id: 'free_burger_500',
    name: 'Free Burger',
    description: 'Get any burger for free',
    pointsCost: 500,
    category: 'food',
    type: 'free_item',
    value: 'burger',
    maxCogsValue: 6.00, // Max COGS $6
    active: true
  },
  {
    id: 'shirt_600',
    name: 'Broski Shirt',
    description: 'Get a Broski branded shirt',
    pointsCost: 600,
    category: 'merchandise',
    type: 'merchandise',
    value: 'shirt',
    maxCogsValue: 12.00, // Max cost $12
    active: true
  },
  {
    id: 'discount_20pct_700',
    name: '20% Off',
    description: 'Get 20% off food subtotal only',
    pointsCost: 700,
    category: 'discount',
    type: 'percentage_discount',
    value: 20,
    maxCogsValue: null, // No COGS cap for percentage discounts
    active: true
  },
  {
    id: 'cookbook_1000',
    name: 'Broski Cookbook',
    description: 'Get the official Broski cookbook',
    pointsCost: 1000,
    category: 'merchandise',
    type: 'merchandise',
    value: 'cookbook',
    maxCogsValue: 20.00, // Max cost $20
    active: true
  }
]

// Get reward catalog function
function getRewardCatalog() {
  return REWARDS_CATALOG.filter(reward => reward.active)
}

// NEW PROFIT LOGIC - COGS validation based on reward catalog maxCogsValue
// Individual reward COGS caps are now defined in the reward catalog
// This function validates against those specific caps

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

// NEW PROFIT LOGIC - Calculate COGS based on reward catalog maxCogsValue
function calculateCOGS(reward: any, itemCogs: number, orderSubtotal: number): number {
  if (reward.type === 'percentage_discount') {
    // For percentage discounts, COGS is the discount amount (no cap)
    return orderSubtotal * (reward.value / 100)
  }
  
  if (reward.type === 'free_item' || reward.type === 'merchandise') {
    // For free items and merchandise, enforce maxCogsValue cap
    if (reward.maxCogsValue && itemCogs > reward.maxCogsValue) {
      throw new Error(`Item COGS ($${itemCogs}) exceeds maximum allowed ($${reward.maxCogsValue})`)
    }
    return itemCogs
  }
  
  return itemCogs
}

// Validate COGS doesn't exceed 8% of order subtotal
function validateTotalCOGS(cogsValue: number, orderSubtotal: number): boolean {
  const maxTotalCOGS = orderSubtotal * MAX_TOTAL_COGS_PERCENTAGE
  return cogsValue <= maxTotalCOGS
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
    }
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

    // Validate order items don't contain excluded categories
    const orderItems = body.orderItems || []
    const hasExcludedItems = orderItems.some((item: any) => {
      const itemName = (item.name || '').toLowerCase()
      const itemCategory = (item.category || '').toLowerCase()
      
      return (
        itemName.includes('alcohol') ||
        itemName.includes('beer') ||
        itemName.includes('wine') ||
        itemName.includes('liquor') ||
        itemName.includes('gift card') ||
        itemCategory.includes('alcohol') ||
        itemCategory.includes('beverages') && (
          itemName.includes('beer') ||
          itemName.includes('wine') ||
          itemName.includes('margarita')
        )
      )
    })

    if (hasExcludedItems) {
      return NextResponse.json({
        success: false,
        error: 'Rewards cannot be applied to orders containing alcohol or gift cards'
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
    
    // Get user rewards
    let userRewards = await getUserRewards(userId)

    
    // Get reward details from catalog
    const rewardCatalog = await getRewardCatalog()
    const reward = rewardCatalog.find(r => r.id === rewardId)
    
    if (!reward || !reward.active) {
      return NextResponse.json({ success: false, error: 'INVALID_REWARD' }, { status: 400 })
    }
    
    // Validate user has enough points
    if (userRewards.totalPoints < reward.pointsCost) {
      return NextResponse.json({ success: false, error: 'INSUFFICIENT_POINTS' }, { status: 400 })
    }
    
    // NEW PROFIT LOGIC - Calculate COGS with new validation
    let rewardCOGS: number
    try {
      // For free items and merchandise, itemCogs should be provided in the request
      const itemCogs = body.itemCogs || reward.value || 0
      rewardCOGS = calculateCOGS(reward, itemCogs, orderSubtotal)
    } catch (error: any) {
      return NextResponse.json({ 
        success: false, 
        error: 'COGS_CAP_EXCEEDED',
        details: error.message
      }, { status: 400 })
    }
    
    // Check if COGS exceeds maximum allowed per order (8%)
    if (rewardCOGS > MAX_TOTAL_COGS_PERCENTAGE * orderSubtotal) {
      return NextResponse.json({ 
        success: false, 
        error: 'COGS_LIMIT_EXCEEDED',
        details: `Reward COGS ($${rewardCOGS.toFixed(2)}) exceeds maximum allowed per order ($${(MAX_TOTAL_COGS_PERCENTAGE * orderSubtotal).toFixed(2)})`
      }, { status: 400 })
    }
    
    if (!userRewards) {
      return NextResponse.json({
        success: false,
        error: 'User rewards profile not found'
      }, { status: 404 })
    }
    
    // Calculate new balance
    const newBalance = userRewards.totalPoints - reward.pointsCost
    
    // Update user rewards
    const updatedRewards = {
      ...userRewards,
      totalPoints: newBalance,
      lifetimeSpent: (userRewards.lifetimeSpent || 0) + reward.pointsCost,
      lastUpdated: new Date()
    }
    
    await updateUserRewards(userId, updatedRewards)
    
    // Record the redemption
    const redemptionRecord = {
      id: idempotencyKey,
      userId,
      orderId,
      rewardId,
      rewardType: reward.type,
      rewardValue: reward.value,
      pointsDeducted: reward.pointsCost,
      cogsValue: rewardCOGS,
      newBalance,
      createdAt: new Date(),
      metadata: {
        orderSubtotal,
        idempotencyKey
      }
    }
    
    // Save redemption record
    let redemptionId: string
    if (idempotencyKey) {
      await setDoc(doc(db, 'redemptions', idempotencyKey), redemptionRecord)
      redemptionId = idempotencyKey
    } else {
      const redemptionRef = doc(collection(db, 'redemptions'))
      await setDoc(redemptionRef, redemptionRecord)
      redemptionId = redemptionRef.id
    }
    
    // Create points transaction record
    await addPointsTransaction(userId, {
      type: 'redeemed',
      amount: -reward.pointsCost,
      description: `Redeemed: ${reward.name}`,
      orderId,
      metadata: {
        redemptionId,
        rewardId,
        rewardType: reward.type,
        rewardValue: reward.value,
        cogsValue: rewardCOGS
      }
    })
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    return new NextResponse(JSON.stringify({
      success: true,
      redemptionId,
      pointsDeducted: reward.pointsCost,
      newBalance,
      cogsValue: rewardCOGS,
      message: 'Reward redeemed successfully'
    }), { status: 200, headers })
    
  } catch (error) {
    console.error('Redemption error:', error)
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
    }
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
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    return new NextResponse(JSON.stringify({
      success: true,
      redemptions,
      hasRedeemedForOrder: hasRedeemedForThisOrder,

      maxTotalCogsPercentage: MAX_TOTAL_COGS_PERCENTAGE
    }), { status: 200, headers })
    
  } catch (error) {
    console.error('Get redemptions error:', error)
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'