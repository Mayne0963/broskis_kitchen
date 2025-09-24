import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getLoyaltyProfile } from '@/lib/rewards';
import { getExpiringPoints } from '@/lib/services/rewardsService';
import { BalanceResponse } from '@/types/rewards';

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
    
    // Get points expiring in 30 days
    const expiringPointsData = await getExpiringPoints(user.uid, 30);
    const expiringPoints = expiringPointsData.reduce((total, points) => total + points.points, 0);
    
    const response: BalanceResponse = {
      success: true,
      data: {
        currentPoints: loyaltyProfile.currentPoints,
        pendingPoints: loyaltyProfile.pendingPoints,
        totalEarned: loyaltyProfile.totalEarned,
        totalRedeemed: loyaltyProfile.totalRedeemed,
        tier: loyaltyProfile.tier,
        expiringPoints,
        lastSpinDate: loyaltyProfile.lastSpinDate,
        canSpin: loyaltyProfile.canSpin
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}