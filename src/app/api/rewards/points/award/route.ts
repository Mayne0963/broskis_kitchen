import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'
import { 
  getUserRewards, 
  createUserRewards, 
  updateUserRewards,
  addPointsTransaction
} from '@/lib/services/rewardsService'
import { db } from '@/lib/services/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic';

// POST /api/rewards/points/award - Award points based on order with profit-focused logic
export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    const { 
      orderId, 
      orderSubtotal, 
      taxAmount = 0, 
      tipAmount = 0, 
      deliveryFee = 0,
      idempotencyKey 
    } = body
    
    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    if (!orderSubtotal || typeof orderSubtotal !== 'number' || orderSubtotal <= 0) {
      return NextResponse.json(
        { error: 'Valid order subtotal is required' },
        { status: 400 }
      )
    }
    
    // Check for idempotency - prevent duplicate point awards for same order
    if (idempotencyKey) {
      const idempotencyRef = doc(db, 'pointsIdempotency', idempotencyKey)
      const idempotencyDoc = await getDoc(idempotencyRef)
      
      if (idempotencyDoc.exists()) {
        const existingResult = idempotencyDoc.data()
        return NextResponse.json({
          success: true,
          pointsAwarded: existingResult.pointsAwarded,
          newBalance: existingResult.newBalance,
          message: 'Points already awarded for this order',
          duplicate: true
        }, {
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
        });
      }
    }
    
    // Calculate points using profit-focused formula: floor(order_subtotal * 0.1)
    // Exclude taxes, tips, and delivery fees from calculation
    const eligibleAmount = orderSubtotal
    const pointsToAward = Math.floor(eligibleAmount * 0.1)
    
    // Minimum 1 point for any purchase
    const finalPoints = Math.max(pointsToAward, 1)
    
    // Get current user rewards
    let userRewards = await getUserRewards(userId)
    
    // Create rewards record if it doesn't exist
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    // Create points transaction with expiry date (30 days from now)
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)
    
    const pointsEntry = await addPointsTransaction({
      userId,
      type: 'earned',
      points: finalPoints,
      description: `Order purchase - $${orderSubtotal.toFixed(2)}`,
      date: new Date(),
      orderId,
      expiryDate,
      metadata: {
        orderSubtotal: eligibleAmount,
        taxAmount,
        tipAmount,
        deliveryFee,
        pointsRate: 0.1
      }
    })
    
    // Update user rewards
    const newPoints = userRewards.points + finalPoints
    const newLifetimePoints = userRewards.lifetimePoints + finalPoints
    const newTotalSpent = userRewards.totalSpent + orderSubtotal
    const newOrdersCount = userRewards.ordersCount + 1
    
    // Calculate tier based on lifetime points
    let newTier = 'Bronze'
    let nextTier = 'Silver'
    let pointsToNextTier = 500
    
    if (newLifetimePoints >= 2000) {
      newTier = 'Gold'
      nextTier = 'Platinum'
      pointsToNextTier = 5000 - newLifetimePoints
    } else if (newLifetimePoints >= 500) {
      newTier = 'Silver'
      nextTier = 'Gold'
      pointsToNextTier = 2000 - newLifetimePoints
    } else {
      pointsToNextTier = 500 - newLifetimePoints
    }
    
    const tierUpgrade = newTier !== userRewards.tier
    
    const updatedRewards = await updateUserRewards(userId, {
      points: newPoints,
      lifetimePoints: newLifetimePoints,
      totalSpent: newTotalSpent,
      ordersCount: newOrdersCount,
      tier: newTier,
      nextTier,
      pointsToNextTier: Math.max(pointsToNextTier, 0)
    })
    
    // Store idempotency record to prevent duplicates
    if (idempotencyKey) {
      const idempotencyData = {
        pointsAwarded: finalPoints,
        newBalance: newPoints,
        orderId,
        userId,
        createdAt: new Date()
      }
      
      await setDoc(doc(db, 'pointsIdempotency', idempotencyKey), idempotencyData)
    }
    
    // Calculate giveback percentage for monitoring
    const givebackPercentage = (finalPoints * 0.10) / orderSubtotal * 100 // Assuming 1 point = $0.10 value
    
    return NextResponse.json({
      success: true,
      pointsAwarded: finalPoints,
      newBalance: newPoints,
      tierUpgrade,
      newTier,
      nextTier,
      pointsToNextTier: Math.max(pointsToNextTier, 0),
      entry: pointsEntry,
      calculation: {
        orderSubtotal: eligibleAmount,
        pointsRate: 0.1,
        rawPoints: pointsToAward,
        finalPoints,
        givebackPercentage: Math.round(givebackPercentage * 100) / 100
      },
      expiryDate: expiryDate.toISOString()
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    });
    
  } catch (error) {
    console.error('Error awarding points:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL' },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
      }
    );
  }
}