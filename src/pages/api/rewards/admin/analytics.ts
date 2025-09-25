import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../../../../lib/firebase-admin';
import { verifyAdminToken } from '../../../../lib/auth';
import { PointsTransaction, UserRedemption, SpinHistory, LoyaltyProfile } from '../../../../types/rewards';

interface AnalyticsResponse {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    totalCOGS: number;
    averageGivebackPercentage: number;
    currentBalance: number;
  };
  userTiers: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  redemptions: {
    totalRedemptions: number;
    totalValue: number;
    averageRedemptionValue: number;
    topRewards: Array<{
      rewardId: string;
      rewardName: string;
      count: number;
      totalCOGS: number;
    }>;
  };
  spins: {
    totalSpins: number;
    totalPointsAwarded: number;
    averagePointsPerSpin: number;
    spinsByTier: {
      bronze: number;
      silver: number;
      gold: number;
      platinum: number;
    };
  };
  cogsAnalysis: {
    last30Days: {
      totalCOGS: number;
      totalRevenue: number;
      givebackPercentage: number;
      dailyBreakdown: Array<{
        date: string;
        cogs: number;
        revenue: number;
        givebackPercentage: number;
      }>;
    };
    last7Days: {
      totalCOGS: number;
      totalRevenue: number;
      givebackPercentage: number;
    };
    today: {
      totalCOGS: number;
      totalRevenue: number;
      givebackPercentage: number;
    };
  };
  trends: {
    dailyActiveUsers: Array<{
      date: string;
      count: number;
    }>;
    dailyRedemptions: Array<{
      date: string;
      count: number;
      value: number;
    }>;
    dailySpins: Array<{
      date: string;
      count: number;
      pointsAwarded: number;
    }>;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const user = await verifyAdminToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get query parameters
    const { days = '30' } = req.query;
    const daysNum = Math.min(parseInt(days as string, 10), 365); // Max 1 year

    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();

    // Calculate date ranges
    const now = new Date();
    const startDate = new Date(now.getTime() - (daysNum * 24 * 60 * 60 * 1000));
    const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all loyalty profiles for user statistics
    const loyaltySnapshot = await db.collection('loyalty').get();
    const loyaltyProfiles: LoyaltyProfile[] = [];
    loyaltySnapshot.forEach(doc => {
      loyaltyProfiles.push(doc.data() as LoyaltyProfile);
    });

    // Calculate user tier distribution
    const userTiers = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    };

    let totalCurrentBalance = 0;
    let activeUsers = 0;
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    loyaltyProfiles.forEach(profile => {
      userTiers[profile.tier]++;
      totalCurrentBalance += profile.currentPoints;
      
      // Count as active if they have activity in the last 30 days
      if (profile.lastActivity && profile.lastActivity >= thirtyDaysAgo) {
        activeUsers++;
      }
    });

    // Get points transactions
    const transactionsSnapshot = await db.collection('pointsTransactions')
      .where('createdAt', '>=', startDate)
      .orderBy('createdAt', 'desc')
      .get();

    const transactions: PointsTransaction[] = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push(doc.data() as PointsTransaction);
    });

    // Calculate points statistics
    let totalPointsIssued = 0;
    let totalPointsRedeemed = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'earned') {
        totalPointsIssued += transaction.points;
      } else if (transaction.type === 'redeemed') {
        totalPointsRedeemed += Math.abs(transaction.points);
      }
    });

    // Get redemptions
    const redemptionsSnapshot = await db.collection('userRedemptions')
      .where('redeemedAt', '>=', startDate)
      .orderBy('redeemedAt', 'desc')
      .get();

    const redemptions: UserRedemption[] = [];
    redemptionsSnapshot.forEach(doc => {
      redemptions.push(doc.data() as UserRedemption);
    });

    // Calculate redemption statistics
    const totalRedemptions = redemptions.length;
    let totalRedemptionValue = 0;
    let totalCOGS = 0;
    const rewardCounts: { [key: string]: { count: number; name: string; totalCOGS: number } } = {};

    redemptions.forEach(redemption => {
      totalRedemptionValue += redemption.pointsUsed;
      totalCOGS += redemption.cogs * redemption.quantity;
      
      if (!rewardCounts[redemption.rewardId]) {
        rewardCounts[redemption.rewardId] = {
          count: 0,
          name: redemption.rewardName,
          totalCOGS: 0
        };
      }
      rewardCounts[redemption.rewardId].count += redemption.quantity;
      rewardCounts[redemption.rewardId].totalCOGS += redemption.cogs * redemption.quantity;
    });

    const topRewards = Object.entries(rewardCounts)
      .map(([rewardId, data]) => ({
        rewardId,
        rewardName: data.name,
        count: data.count,
        totalCOGS: data.totalCOGS
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get spin history
    const spinsSnapshot = await db.collection('spinHistory')
      .where('spunAt', '>=', startDate)
      .orderBy('spunAt', 'desc')
      .get();

    const spins: SpinHistory[] = [];
    spinsSnapshot.forEach(doc => {
      spins.push(doc.data() as SpinHistory);
    });

    // Calculate spin statistics
    const totalSpins = spins.length;
    let totalSpinPointsAwarded = 0;
    const spinsByTier = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0
    };

    spins.forEach(spin => {
      if (spin.result === 'points') {
        totalSpinPointsAwarded += spin.value;
      }
      spinsByTier[spin.userTier]++;
    });

    // Calculate COGS analysis with revenue estimates
    const calculateCOGSAnalysis = (startDate: Date, endDate: Date) => {
      const periodRedemptions = redemptions.filter(r => 
        r.redeemedAt >= startDate && r.redeemedAt <= endDate
      );
      
      const totalCOGS = periodRedemptions.reduce((sum, r) => 
        sum + (r.cogs * r.quantity), 0
      );
      
      // Estimate revenue based on points redeemed (assuming 1 point = $0.01 in customer value)
      const totalRevenue = periodRedemptions.reduce((sum, r) => 
        sum + (r.pointsUsed * 0.01), 0
      );
      
      const givebackPercentage = totalRevenue > 0 ? (totalCOGS / totalRevenue) * 100 : 0;
      
      return { totalCOGS, totalRevenue, givebackPercentage };
    };

    const last30DaysAnalysis = calculateCOGSAnalysis(last30Days, now);
    const last7DaysAnalysis = calculateCOGSAnalysis(last7Days, now);
    const todayAnalysis = calculateCOGSAnalysis(today, now);

    // Generate daily breakdown for last 30 days
    const dailyBreakdown = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const nextDate = new Date(date.getTime() + (24 * 60 * 60 * 1000));
      const dayAnalysis = calculateCOGSAnalysis(date, nextDate);
      
      dailyBreakdown.push({
        date: date.toISOString().split('T')[0],
        cogs: dayAnalysis.totalCOGS,
        revenue: dayAnalysis.totalRevenue,
        givebackPercentage: dayAnalysis.givebackPercentage
      });
    }

    // Generate trend data
    const dailyActiveUsers = [];
    const dailyRedemptions = [];
    const dailySpins = [];

    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const nextDate = new Date(date.getTime() + (24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];

      // Count active users (users with any activity on that day)
      const dayTransactions = transactions.filter(t => 
        t.createdAt >= date && t.createdAt < nextDate
      );
      const dayRedemptions = redemptions.filter(r => 
        r.redeemedAt >= date && r.redeemedAt < nextDate
      );
      const daySpins = spins.filter(s => 
        s.spunAt >= date && s.spunAt < nextDate
      );

      const activeUserIds = new Set([
        ...dayTransactions.map(t => t.userId),
        ...dayRedemptions.map(r => r.userId),
        ...daySpins.map(s => s.userId)
      ]);

      dailyActiveUsers.push({
        date: dateStr,
        count: activeUserIds.size
      });

      dailyRedemptions.push({
        date: dateStr,
        count: dayRedemptions.length,
        value: dayRedemptions.reduce((sum, r) => sum + r.pointsUsed, 0)
      });

      const daySpinPoints = daySpins
        .filter(s => s.result === 'points')
        .reduce((sum, s) => sum + s.value, 0);

      dailySpins.push({
        date: dateStr,
        count: daySpins.length,
        pointsAwarded: daySpinPoints
      });
    }

    // Calculate average giveback percentage
    const averageGivebackPercentage = last30DaysAnalysis.givebackPercentage;

    const response: AnalyticsResponse = {
      overview: {
        totalUsers: loyaltyProfiles.length,
        activeUsers,
        totalPointsIssued,
        totalPointsRedeemed,
        totalCOGS,
        averageGivebackPercentage,
        currentBalance: totalCurrentBalance
      },
      userTiers,
      redemptions: {
        totalRedemptions,
        totalValue: totalRedemptionValue,
        averageRedemptionValue: totalRedemptions > 0 ? totalRedemptionValue / totalRedemptions : 0,
        topRewards
      },
      spins: {
        totalSpins,
        totalPointsAwarded: totalSpinPointsAwarded,
        averagePointsPerSpin: totalSpins > 0 ? totalSpinPointsAwarded / totalSpins : 0,
        spinsByTier
      },
      cogsAnalysis: {
        last30Days: {
          ...last30DaysAnalysis,
          dailyBreakdown
        },
        last7Days: last7DaysAnalysis,
        today: todayAnalysis
      },
      trends: {
        dailyActiveUsers,
        dailyRedemptions,
        dailySpins
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}