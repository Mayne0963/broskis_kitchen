import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getActiveRewards, getLoyaltyProfile } from '@/lib/rewards';
import { CatalogResponse } from '@/types/rewards';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req);
    
    // Get user's loyalty profile for tier information
    const loyaltyProfile = await getLoyaltyProfile(user.uid);
    
    if (!loyaltyProfile) {
      return NextResponse.json({
        success: false,
        error: 'Loyalty profile not found'
      }, { status: 404 });
    }
    
    // Get active rewards from catalog
    const rewards = await getActiveRewards();
    
    // Filter rewards based on user's current points and add affordability info
    const enrichedRewards = rewards.map(reward => ({
      ...reward,
      canAfford: loyaltyProfile.currentPoints >= reward.pointsCost,
      userPoints: loyaltyProfile.currentPoints
    }));
    
    // Sort by category and points cost
    const sortedRewards = enrichedRewards.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.pointsCost - b.pointsCost;
    });
    
    const response: CatalogResponse = {
      success: true,
      data: {
        rewards: sortedRewards,
        userTier: loyaltyProfile.tier,
        userPoints: loyaltyProfile.currentPoints
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}