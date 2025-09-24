import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  getLoyaltyProfile, 
  getRewardById, 
  validateRedemption, 
  calculateDiscount,
  updateLoyaltyProfile,
  createPointsTransaction,
  createUserRedemption
} from '@/lib/rewards';
import { RedeemRequest, RedeemResponse } from '@/types/rewards';
import { db } from '@/lib/firebase';
import { runTransaction } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req);
    
    // Parse request body
    const body: RedeemRequest = await req.json();
    const { rewardId, idempotencyKey, orderItems = [], orderSubtotal = 0 } = body;
    
    if (!rewardId || !idempotencyKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: rewardId and idempotencyKey'
      }, { status: 400 });
    }
    
    // Check for existing redemption with same idempotency key
    const existingRedemption = await db.collection('userRedemptions')
      .where('userId', '==', user.uid)
      .where('idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();
    
    if (!existingRedemption.empty) {
      const redemption = existingRedemption.docs[0].data();
      return NextResponse.json({
        success: true,
        data: {
          redemptionId: existingRedemption.docs[0].id,
          discount: redemption.discount,
          message: 'Redemption already processed'
        }
      });
    }
    
    // Get user's loyalty profile and reward details
    const [loyaltyProfile, reward] = await Promise.all([
      getLoyaltyProfile(user.uid),
      getRewardById(rewardId)
    ]);
    
    if (!loyaltyProfile) {
      return NextResponse.json({
        success: false,
        error: 'Loyalty profile not found'
      }, { status: 404 });
    }
    
    if (!reward) {
      return NextResponse.json({
        success: false,
        error: 'Reward not found'
      }, { status: 404 });
    }
    
    // Validate redemption
    const validation = validateRedemption(loyaltyProfile, reward, orderItems, orderSubtotal);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }
    
    // Calculate discount
    const discount = calculateDiscount(reward, orderItems, orderSubtotal);
    
    // Process redemption in transaction
    const result = await runTransaction(db, async (transaction) => {
      // Create redemption record
      const redemptionRef = db.collection('userRedemptions').doc();
      const redemptionData = {
        id: redemptionRef.id,
        userId: user.uid,
        rewardId,
        idempotencyKey,
        pointsUsed: reward.pointsCost,
        discount,
        orderItems,
        orderSubtotal,
        createdAt: new Date(),
        status: 'completed'
      };
      
      transaction.set(redemptionRef, redemptionData);
      
      // Create points transaction
      const pointsTransactionRef = db.collection('pointsTransactions').doc();
      const pointsTransactionData = {
        id: pointsTransactionRef.id,
        userId: user.uid,
        type: 'redemption' as const,
        points: -reward.pointsCost,
        description: `Redeemed: ${reward.name}`,
        metadata: {
          rewardId,
          redemptionId: redemptionRef.id
        },
        createdAt: new Date()
      };
      
      transaction.set(pointsTransactionRef, pointsTransactionData);
      
      // Update loyalty profile
      const loyaltyProfileRef = db.collection('loyalty').doc(user.uid);
      transaction.update(loyaltyProfileRef, {
        currentPoints: loyaltyProfile.currentPoints - reward.pointsCost,
        totalRedeemed: loyaltyProfile.totalRedeemed + reward.pointsCost,
        updatedAt: new Date()
      });
      
      return {
        redemptionId: redemptionRef.id,
        discount
      };
    });
    
    const response: RedeemResponse = {
      success: true,
      data: {
        redemptionId: result.redemptionId,
        discount: result.discount,
        pointsUsed: reward.pointsCost,
        remainingPoints: loyaltyProfile.currentPoints - reward.pointsCost
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error processing redemption:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}