import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/adminOnly";

interface RouteParams {
  params: {
    userId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const transactionLimit = parseInt(searchParams.get('transactionLimit') || '10');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Get recent reward transactions
    const transactionsQuery = adminDb
      .collection('rewardTransactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(Math.min(transactionLimit, 50));

    const transactionsSnapshot = await transactionsQuery.get();
    
    const recentTransactions = transactionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
    });

    // Calculate reward statistics
    const totalEarned = recentTransactions
      .filter(t => t.delta > 0)
      .reduce((sum, t) => sum + t.delta, 0);
    
    const totalSpent = recentTransactions
      .filter(t => t.delta < 0)
      .reduce((sum, t) => sum + Math.abs(t.delta), 0);

    // Determine reward tier based on points
    const rewardPoints = userData?.rewardPoints || 0;
    let rewardTier = 'Bronze';
    
    if (rewardPoints >= 1000) {
      rewardTier = 'Platinum';
    } else if (rewardPoints >= 500) {
      rewardTier = 'Gold';
    } else if (rewardPoints >= 200) {
      rewardTier = 'Silver';
    }

    // Get tier benefits
    const tierBenefits = {
      Bronze: { discount: 0, pointsMultiplier: 1 },
      Silver: { discount: 5, pointsMultiplier: 1.2 },
      Gold: { discount: 10, pointsMultiplier: 1.5 },
      Platinum: { discount: 15, pointsMultiplier: 2 }
    };

    // Calculate points needed for next tier
    let pointsToNextTier = null;
    if (rewardTier === 'Bronze') pointsToNextTier = 200 - rewardPoints;
    else if (rewardTier === 'Silver') pointsToNextTier = 500 - rewardPoints;
    else if (rewardTier === 'Gold') pointsToNextTier = 1000 - rewardPoints;

    // Get order-related reward statistics
    const ordersWithRewards = await adminDb
      .collection('orders')
      .where('userId', '==', userId)
      .where('rewardPointsEarned', '>', 0)
      .orderBy('rewardPointsEarned', 'desc')
      .limit(5)
      .get();

    const topRewardOrders = ordersWithRewards.docs.map(doc => {
      const data = doc.data();
      return {
        orderId: doc.id,
        rewardPointsEarned: data.rewardPointsEarned,
        total: data.total,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
      };
    });

    const summary = {
      userId,
      userInfo: {
        email: userData?.email,
        displayName: userData?.displayName,
        phone: userData?.phone
      },
      rewards: {
        currentPoints: rewardPoints,
        rewardTier,
        tierBenefits: tierBenefits[rewardTier],
        pointsToNextTier,
        lifetimeEarned: totalEarned,
        lifetimeSpent: totalSpent,
        netPoints: totalEarned - totalSpent
      },
      recentTransactions,
      topRewardOrders,
      statistics: {
        totalTransactions: recentTransactions.length,
        averageTransactionValue: recentTransactions.length > 0 
          ? recentTransactions.reduce((sum, t) => sum + Math.abs(t.delta), 0) / recentTransactions.length 
          : 0,
        lastActivity: recentTransactions.length > 0 
          ? recentTransactions[0].createdAt 
          : null
      }
    };

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Error fetching reward summary:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reward summary',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}