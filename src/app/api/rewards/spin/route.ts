import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  getLoyaltyProfile, 
  canUserSpin, 
  getSpinCost, 
  executeSpin,
  updateLoyaltyProfile,
  createPointsTransaction
} from '@/lib/rewards';
import { SpinRequest, SpinResponse, SPIN_WHEEL_CONFIG } from '@/types/rewards';
import { db } from '@/lib/firebase';
import { runTransaction } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req);
    
    // Parse request body (optional idempotency key)
    const body: SpinRequest = await req.json();
    const { idempotencyKey } = body;
    
    // Get user's loyalty profile
    const loyaltyProfile = await getLoyaltyProfile(user.uid);
    
    if (!loyaltyProfile) {
      return NextResponse.json({
        success: false,
        error: 'Loyalty profile not found'
      }, { status: 404 });
    }
    
    // Check if user can spin (24h cooldown)
    if (!canUserSpin(loyaltyProfile)) {
      const nextSpinTime = new Date(loyaltyProfile.lastSpinDate!.getTime() + 24 * 60 * 60 * 1000);
      return NextResponse.json({
        success: false,
        error: 'Spin cooldown active',
        nextSpinTime: nextSpinTime.toISOString()
      }, { status: 429 });
    }
    
    // Get spin cost based on tier
    const spinCost = getSpinCost(loyaltyProfile.tier);
    
    // Check if user has enough points
    if (loyaltyProfile.currentPoints < spinCost) {
      return NextResponse.json({
        success: false,
        error: `Insufficient points. Need ${spinCost} points to spin.`,
        required: spinCost,
        current: loyaltyProfile.currentPoints
      }, { status: 400 });
    }
    
    // Check for existing spin with same idempotency key (if provided)
    if (idempotencyKey) {
      const existingSpin = await db.collection('spinHistory')
        .where('userId', '==', user.uid)
        .where('idempotencyKey', '==', idempotencyKey)
        .limit(1)
        .get();
      
      if (!existingSpin.empty) {
        const spin = existingSpin.docs[0].data();
        return NextResponse.json({
          success: true,
          data: {
            spinId: existingSpin.docs[0].id,
            result: spin.result,
            pointsAwarded: spin.pointsAwarded,
            message: 'Spin already processed'
          }
        });
      }
    }
    
    // Execute spin and process in transaction
    const result = await runTransaction(db, async (transaction) => {
      // Execute the spin
      const spinResult = executeSpin();
      
      // Create spin history record
      const spinHistoryRef = db.collection('spinHistory').doc();
      const spinHistoryData = {
        id: spinHistoryRef.id,
        userId: user.uid,
        idempotencyKey: idempotencyKey || null,
        result: spinResult.result,
        pointsAwarded: spinResult.pointsAwarded,
        spinCost,
        tier: loyaltyProfile.tier,
        createdAt: new Date()
      };
      
      transaction.set(spinHistoryRef, spinHistoryData);
      
      // Create points transaction for spin cost
      const costTransactionRef = db.collection('pointsTransactions').doc();
      const costTransactionData = {
        id: costTransactionRef.id,
        userId: user.uid,
        type: 'spin_cost' as const,
        points: -spinCost,
        description: `Spin wheel cost (${loyaltyProfile.tier} tier)`,
        metadata: {
          spinId: spinHistoryRef.id,
          tier: loyaltyProfile.tier
        },
        createdAt: new Date()
      };
      
      transaction.set(costTransactionRef, costTransactionData);
      
      // Create points transaction for winnings (if any)
      if (spinResult.pointsAwarded > 0) {
        const winningsTransactionRef = db.collection('pointsTransactions').doc();
        const winningsTransactionData = {
          id: winningsTransactionRef.id,
          userId: user.uid,
          type: 'spin_win' as const,
          points: spinResult.pointsAwarded,
          description: `Spin wheel win: ${spinResult.result}`,
          metadata: {
            spinId: spinHistoryRef.id,
            result: spinResult.result
          },
          createdAt: new Date()
        };
        
        transaction.set(winningsTransactionRef, winningsTransactionData);
      }
      
      // Update loyalty profile
      const loyaltyProfileRef = db.collection('loyalty').doc(user.uid);
      const newPoints = loyaltyProfile.currentPoints - spinCost + spinResult.pointsAwarded;
      const newTotalEarned = loyaltyProfile.totalEarned + spinResult.pointsAwarded;
      
      transaction.update(loyaltyProfileRef, {
        currentPoints: newPoints,
        totalEarned: newTotalEarned,
        lastSpinDate: new Date(),
        canSpin: false,
        updatedAt: new Date()
      });
      
      return {
        spinId: spinHistoryRef.id,
        result: spinResult.result,
        pointsAwarded: spinResult.pointsAwarded,
        newBalance: newPoints
      };
    });
    
    const response: SpinResponse = {
      success: true,
      data: {
        spinId: result.spinId,
        result: result.result,
        pointsAwarded: result.pointsAwarded,
        pointsSpent: spinCost,
        newBalance: result.newBalance,
        nextSpinAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error processing spin:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET endpoint to check spin availability
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req);
    
    // Get user's loyalty profile
    const loyaltyProfile = await getLoyaltyProfile(user.uid);
    
    if (!loyaltyProfile) {
      return NextResponse.json({
        success: false,
        error: 'Loyalty profile not found'
      }, { status: 404 });
    }
    
    const canSpin = canUserSpin(loyaltyProfile);
    const spinCost = getSpinCost(loyaltyProfile.tier);
    const hasEnoughPoints = loyaltyProfile.currentPoints >= spinCost;
    
    let nextSpinTime = null;
    if (!canSpin && loyaltyProfile.lastSpinDate) {
      nextSpinTime = new Date(loyaltyProfile.lastSpinDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
    
    return NextResponse.json({
      success: true,
      data: {
        canSpin: canSpin && hasEnoughPoints,
        spinCost,
        currentPoints: loyaltyProfile.currentPoints,
        hasEnoughPoints,
        cooldownActive: !canSpin,
        nextSpinTime,
        tier: loyaltyProfile.tier,
        spinWheel: SPIN_WHEEL_CONFIG
      }
    });
    
  } catch (error) {
    console.error('Error checking spin availability:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}