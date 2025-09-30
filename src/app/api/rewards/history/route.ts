import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/session';
import { db } from '@/lib/firebase/admin';
import { HistoryResponse, PointsTransaction } from '@/types/rewards';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // filter by transaction type
    
    // Validate limit
    if (limit > 100) {
      return NextResponse.json({
        success: false,
        error: 'Limit cannot exceed 100'
      }, { status: 400 });
    }
    
    // Build query
    let query = db.collection('pointsTransactions')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc');
    
    // Add type filter if specified
    if (type && ['purchase', 'redemption', 'spin_cost', 'spin_win', 'bonus', 'expiry'].includes(type)) {
      query = query.where('type', '==', type);
    }
    
    // Apply pagination
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }
    
    // Execute query
    const snapshot = await query.limit(limit).get();
    
    // Transform data
    const transactions: PointsTransaction[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        type: data.type,
        points: data.points,
        description: data.description,
        metadata: data.metadata || {},
        expiresAt: data.expiresAt?.toDate() || null,
        createdAt: data.createdAt.toDate()
      };
    });
    
    // Get total count for pagination info
    let totalQuery = db.collection('pointsTransactions')
      .where('userId', '==', user.uid);
    
    if (type && ['purchase', 'redemption', 'spin_cost', 'spin_win', 'bonus', 'expiry'].includes(type)) {
      totalQuery = totalQuery.where('type', '==', type);
    }
    
    const totalSnapshot = await totalQuery.count().get();
    const total = totalSnapshot.data().count;
    
    // Calculate summary statistics
    const summary = {
      totalEarned: 0,
      totalSpent: 0,
      totalExpired: 0,
      transactionCount: total
    };
    
    // Calculate summary from all user transactions (not just current page)
    const allTransactionsSnapshot = await db.collection('pointsTransactions')
      .where('userId', '==', user.uid)
      .get();
    
    allTransactionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const points = data.points;
      
      if (points > 0) {
        summary.totalEarned += points;
      } else {
        summary.totalSpent += Math.abs(points);
      }
      
      if (data.type === 'expiry') {
        summary.totalExpired += Math.abs(points);
      }
    });
    
    const response: HistoryResponse = {
      success: true,
      data: {
        transactions,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + transactions.length < total
        },
        summary,
        filters: {
          type: type || null
        }
      }
    };
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify(response), { status: 200, headers });
    
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';