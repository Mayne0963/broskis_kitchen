import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../../../lib/firebase-admin';
import { verifyAuthToken } from '../../../lib/auth';
import { PointsTransaction, UserRedemption, SpinHistory } from '../../../types/rewards';

interface HistoryItem {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'spin';
  points?: number;
  description: string;
  date: Date;
  status?: string;
  metadata?: any;
}

interface HistoryResponse {
  transactions: HistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  summary: {
    totalEarned: number;
    totalSpent: number;
    totalExpired: number;
    currentBalance: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoryResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get query parameters
    const {
      page = '1',
      limit = '20',
      type,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();

    // Build date filters
    let startDateFilter: Date | null = null;
    let endDateFilter: Date | null = null;
    
    if (startDate && typeof startDate === 'string') {
      startDateFilter = new Date(startDate);
    }
    
    if (endDate && typeof endDate === 'string') {
      endDateFilter = new Date(endDate);
      endDateFilter.setHours(23, 59, 59, 999); // End of day
    }

    const allTransactions: HistoryItem[] = [];

    // Get points transactions
    if (!type || type === 'earned' || type === 'redeemed' || type === 'expired') {
      let transactionsQuery = db.collection('pointsTransactions')
        .where('userId', '==', user.uid);
      
      if (type && ['earned', 'redeemed', 'expired'].includes(type as string)) {
        transactionsQuery = transactionsQuery.where('type', '==', type);
      }
      
      if (startDateFilter) {
        transactionsQuery = transactionsQuery.where('createdAt', '>=', startDateFilter);
      }
      
      if (endDateFilter) {
        transactionsQuery = transactionsQuery.where('createdAt', '<=', endDateFilter);
      }
      
      const transactionsSnapshot = await transactionsQuery
        .orderBy('createdAt', 'desc')
        .get();
      
      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data() as PointsTransaction;
        allTransactions.push({
          id: transaction.id,
          type: transaction.type,
          points: transaction.points,
          description: transaction.description,
          date: transaction.createdAt,
          metadata: transaction.metadata
        });
      });
    }

    // Get redemption history
    if (!type || type === 'redeemed') {
      let redemptionsQuery = db.collection('userRedemptions')
        .where('userId', '==', user.uid);
      
      if (startDateFilter) {
        redemptionsQuery = redemptionsQuery.where('redeemedAt', '>=', startDateFilter);
      }
      
      if (endDateFilter) {
        redemptionsQuery = redemptionsQuery.where('redeemedAt', '<=', endDateFilter);
      }
      
      const redemptionsSnapshot = await redemptionsQuery
        .orderBy('redeemedAt', 'desc')
        .get();
      
      redemptionsSnapshot.forEach(doc => {
        const redemption = doc.data() as UserRedemption;
        allTransactions.push({
          id: redemption.id,
          type: 'redeemed',
          points: -redemption.pointsUsed,
          description: `Redeemed: ${redemption.rewardName}${redemption.quantity > 1 ? ` (x${redemption.quantity})` : ''}`,
          date: redemption.redeemedAt,
          status: redemption.status,
          metadata: {
            rewardId: redemption.rewardId,
            quantity: redemption.quantity,
            fulfillmentCode: redemption.fulfillmentCode,
            expiresAt: redemption.expiresAt
          }
        });
      });
    }

    // Get spin history
    if (!type || type === 'spin') {
      let spinsQuery = db.collection('spinHistory')
        .where('userId', '==', user.uid);
      
      if (startDateFilter) {
        spinsQuery = spinsQuery.where('spunAt', '>=', startDateFilter);
      }
      
      if (endDateFilter) {
        spinsQuery = spinsQuery.where('spunAt', '<=', endDateFilter);
      }
      
      const spinsSnapshot = await spinsQuery
        .orderBy('spunAt', 'desc')
        .get();
      
      spinsSnapshot.forEach(doc => {
        const spin = doc.data() as SpinHistory;
        allTransactions.push({
          id: spin.id,
          type: 'spin',
          points: spin.result === 'points' ? spin.value : undefined,
          description: `Spin wheel: ${spin.description}`,
          date: spin.spunAt,
          metadata: {
            result: spin.result,
            value: spin.value,
            userTier: spin.userTier
          }
        });
      });
    }

    // Sort all transactions by date (newest first)
    allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply pagination
    const total = allTransactions.length;
    const paginatedTransactions = allTransactions.slice(offset, offset + limitNum);
    const hasMore = offset + limitNum < total;

    // Calculate summary statistics
    const summary = {
      totalEarned: 0,
      totalSpent: 0,
      totalExpired: 0,
      currentBalance: 0
    };

    // Get current balance from loyalty profile
    const loyaltyRef = db.collection('loyalty').doc(user.uid);
    const loyaltyDoc = await loyaltyRef.get();
    
    if (loyaltyDoc.exists) {
      const loyaltyData = loyaltyDoc.data();
      summary.currentBalance = loyaltyData?.currentPoints || 0;
    }

    // Calculate totals from all transactions
    allTransactions.forEach(transaction => {
      if (transaction.points) {
        if (transaction.type === 'earned' || transaction.type === 'spin') {
          summary.totalEarned += Math.abs(transaction.points);
        } else if (transaction.type === 'redeemed') {
          summary.totalSpent += Math.abs(transaction.points);
        } else if (transaction.type === 'expired') {
          summary.totalExpired += Math.abs(transaction.points);
        }
      }
    });

    return res.status(200).json({
      transactions: paginatedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore
      },
      summary
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}