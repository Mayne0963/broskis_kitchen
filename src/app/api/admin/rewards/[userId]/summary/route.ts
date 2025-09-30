/**
 * Admin Rewards Summary API endpoint
 * GET /api/admin/rewards/[userId]/summary - Get reward summary for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { RewardSummary, RewardTransaction } from '@/types/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin authentication
    const adminOrRes = await requireAdmin(request as any);
    if (adminOrRes instanceof Response) return adminOrRes;
    
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get user document to fetch current reward points and tier
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    
    // Get recent reward transactions (last 50)
    const recentTransactionsSnapshot = await db.collection(COLLECTIONS.REWARD_TRANSACTIONS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const recentTransactions: RewardTransaction[] = recentTransactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt
    })) as RewardTransaction[];
    
    // Calculate total earned and spent
    const allTransactionsSnapshot = await db.collection(COLLECTIONS.REWARD_TRANSACTIONS)
      .where('userId', '==', userId)
      .get();
    
    let totalEarned = 0;
    let totalSpent = 0;
    
    allTransactionsSnapshot.docs.forEach(doc => {
      const transaction = doc.data();
      if (transaction.delta > 0) {
        totalEarned += transaction.delta;
      } else {
        totalSpent += Math.abs(transaction.delta);
      }
    });
    
    // Prepare response
    const summary: RewardSummary = {
      userId,
      rewardPoints: userData.rewardPoints || 0,
      rewardTier: userData.rewardTier || 'bronze',
      recentTransactions,
      totalEarned,
      totalSpent
    };
    
    return NextResponse.json(summary);
    
  } catch (error) {
    console.error('Admin rewards summary API error:', error);
    
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error;
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch reward summary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}