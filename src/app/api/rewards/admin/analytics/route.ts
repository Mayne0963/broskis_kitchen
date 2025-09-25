import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { calculateGivebackPercentage } from '@/lib/rewards';
import { AdminAnalyticsResponse } from '@/types/rewards';

export async function GET(req: NextRequest) {
  try {
    // Authenticate admin
    const adminOrRes = await requireAdmin(req as any);
    if (adminOrRes instanceof Response) return adminOrRes;
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    
    // Calculate date range
    let start: Date;
    let end: Date = new Date();
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Use period to calculate range
      const now = new Date();
      switch (period) {
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default: // 30d
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }
    
    // Get points transactions in date range
    const pointsTransactionsSnapshot = await db.collection('pointsTransactions')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();
    
    // Get redemptions in date range
    const redemptionsSnapshot = await db.collection('userRedemptions')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();
    
    // Get spin history in date range
    const spinHistorySnapshot = await db.collection('spinHistory')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();
    
    // Calculate metrics
    let totalPointsEarned = 0;
    let totalPointsRedeemed = 0;
    let totalPointsExpired = 0;
    let totalSpinCosts = 0;
    let totalSpinWinnings = 0;
    let purchaseTransactions = 0;
    let totalPurchaseAmount = 0;
    
    // Process points transactions
    pointsTransactionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const points = data.points;
      
      switch (data.type) {
        case 'purchase':
          totalPointsEarned += points;
          purchaseTransactions++;
          if (data.metadata?.orderAmount) {
            totalPurchaseAmount += data.metadata.orderAmount;
          }
          break;
        case 'redemption':
          totalPointsRedeemed += Math.abs(points);
          break;
        case 'spin_cost':
          totalSpinCosts += Math.abs(points);
          break;
        case 'spin_win':
          totalSpinWinnings += points;
          break;
        case 'expiry':
          totalPointsExpired += Math.abs(points);
          break;
      }
    });
    
    // Calculate redemption costs
    let totalRedemptionCosts = 0;
    let redemptionCount = 0;
    const redemptionsByCategory: Record<string, { count: number; totalCost: number; totalDiscount: number }> = {};
    
    for (const doc of redemptionsSnapshot.docs) {
      const data = doc.data();
      redemptionCount++;
      
      // Get reward details to calculate COGS
      const rewardSnapshot = await db.collection('rewardCatalog').doc(data.rewardId).get();
      if (rewardSnapshot.exists) {
        const reward = rewardSnapshot.data()!;
        totalRedemptionCosts += reward.cogs || 0;
        
        // Track by category
        const category = reward.category || 'other';
        if (!redemptionsByCategory[category]) {
          redemptionsByCategory[category] = { count: 0, totalCost: 0, totalDiscount: 0 };
        }
        redemptionsByCategory[category].count++;
        redemptionsByCategory[category].totalCost += reward.cogs || 0;
        redemptionsByCategory[category].totalDiscount += data.discount?.amount || 0;
      }
    }
    
    // Calculate spin metrics
    let totalSpinCount = 0;
    let jackpotWins = 0;
    const spinResultCounts: Record<string, number> = {};
    
    spinHistorySnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalSpinCount++;
      
      const result = data.result;
      spinResultCounts[result] = (spinResultCounts[result] || 0) + 1;
      
      if (result === 'Jackpot') {
        jackpotWins++;
      }
    });
    
    // Calculate giveback percentage
    const givebackPercentage = calculateGivebackPercentage(
      totalRedemptionCosts,
      totalPurchaseAmount
    );
    
    // Get active user counts
    const loyaltyProfilesSnapshot = await db.collection('loyalty').get();
    let activeUsers = 0;
    let seniorUsers = 0;
    let volunteerUsers = 0;
    let totalCurrentPoints = 0;
    
    loyaltyProfilesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      activeUsers++;
      totalCurrentPoints += data.currentPoints || 0;
      
      if (data.tier === 'senior') seniorUsers++;
      if (data.tier === 'volunteer') volunteerUsers++;
    });
    
    // Calculate point liability (outstanding points * $0.10)
    const pointLiability = totalCurrentPoints * 0.10;
    
    const response: AdminAnalyticsResponse = {
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
        },
        financial: {
          totalPurchaseAmount,
          totalRedemptionCosts,
          givebackPercentage,
          pointLiability,
          targetGivebackPercentage: 8.0
        },
        points: {
          totalEarned: totalPointsEarned,
          totalRedeemed: totalPointsRedeemed,
          totalExpired: totalPointsExpired,
          outstandingPoints: totalCurrentPoints,
          netPointsIssued: totalPointsEarned - totalPointsRedeemed - totalPointsExpired
        },
        transactions: {
          purchaseCount: purchaseTransactions,
          redemptionCount,
          averageOrderValue: purchaseTransactions > 0 ? totalPurchaseAmount / purchaseTransactions : 0,
          redemptionRate: purchaseTransactions > 0 ? (redemptionCount / purchaseTransactions) * 100 : 0
        },
        spins: {
          totalSpins: totalSpinCount,
          totalSpinCosts,
          totalSpinWinnings,
          jackpotWins,
          jackpotRate: totalSpinCount > 0 ? (jackpotWins / totalSpinCount) * 100 : 0,
          resultBreakdown: spinResultCounts
        },
        users: {
          totalActive: activeUsers,
          seniorTier: seniorUsers,
          volunteerTier: volunteerUsers,
          regularTier: activeUsers - seniorUsers - volunteerUsers
        },
        redemptions: {
          byCategory: redemptionsByCategory,
          averageCost: redemptionCount > 0 ? totalRedemptionCosts / redemptionCount : 0
        },
        alerts: [
          ...(givebackPercentage > 8.0 ? [{
            type: 'warning' as const,
            message: `Giveback percentage (${givebackPercentage.toFixed(2)}%) exceeds target of 8%`,
            severity: 'high' as const
          }] : []),
          ...(pointLiability > 10000 ? [{
            type: 'info' as const,
            message: `High point liability: $${pointLiability.toFixed(2)}`,
            severity: 'medium' as const
          }] : []),
          ...(totalSpinCount > 0 && (jackpotWins / totalSpinCount) > 0.02 ? [{
            type: 'warning' as const,
            message: `Jackpot rate (${((jackpotWins / totalSpinCount) * 100).toFixed(2)}%) exceeds 2% target`,
            severity: 'medium' as const
          }] : [])
        ]
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}