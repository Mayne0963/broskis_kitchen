export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { ensureAdmin, adminDb, Timestamp } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Order } from '@/types/firestore';
import { isAdmin } from '@/lib/rbac';
import { cookies } from 'next/headers';



/**
 * Aggregates global KPI data for admin users
 */
async function aggregateGlobalKPIs() {
  
  try {
    // Get total orders count
    const ordersSnapshot = await adminDb.collection(COLLECTIONS.ORDERS).count().get();
    const totalOrders = ordersSnapshot.data().count;
    
    // Get revenue from completed orders
    const completedOrdersSnapshot = await adminDb
      .collection(COLLECTIONS.ORDERS)
      .where('status', '==', 'completed')
      .get();
    
    let revenueCents = 0;
    completedOrdersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.total && typeof data.total === 'number') {
        revenueCents += data.total;
      }
    });
    
    // Get active users count (users with at least one order in last 30 days)
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const recentOrdersSnapshot = await adminDb
      .collection(COLLECTIONS.ORDERS)
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();
    
    const activeUserIds = new Set();
    recentOrdersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.userId) {
        activeUserIds.add(data.userId);
      }
    });
    
    return {
      totalOrders,
      revenueCents,
      activeUsers: activeUserIds.size
    };
  } catch (error) {
    console.error('Failed to aggregate KPIs:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine') === '1';
    const wantKpi = searchParams.get('kpi') === '1';
    const includeTestParam = searchParams.get('includeTest');
    
    // Determine includeTest default based on environment
    const includeTest = includeTestParam !== null 
      ? includeTestParam === 'true' 
      : process.env.NODE_ENV === 'development';
    
    // For admin-only operations (KPI or all orders), verify admin authentication
    if (wantKpi || !mine) {
      const user = await ensureAdmin(request);
      const userId = user.uid;
      const userRole = user.role || 'admin';
    
      // Handle KPI request (admin only)
      if (wantKpi) {
        const kpi = await aggregateGlobalKPIs();
        return NextResponse.json({ kpi });
      }
    
      // Admin can see all orders (limited to 100)
      let ordersQuery = adminDb
        .collection(COLLECTIONS.ORDERS)
        .orderBy('createdAt', 'desc')
        .limit(100);
      
      // Filter out test orders if includeTest is false
      if (!includeTest) {
        ordersQuery = ordersQuery.where('isTest', '!=', true);
      }
      
      const allOrdersSnapshot = await ordersQuery.get();
    
      const orders = allOrdersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to ISO strings
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          // Ensure test order fields are included
          isTest: data.isTest || false,
          tags: data.tags || []
        };
      });
    
      return NextResponse.json({ orders });
    }
    
    // Handle user's own orders (no admin check needed)
    // TODO: For user's own orders, we should implement proper user authentication
    // For now, this endpoint requires admin access for all operations
    return NextResponse.json(
      { error: 'User order access not implemented with new auth system' },
      { status: 501 }
    );
    
  } catch (error) {
    console.error('Orders API error:', error);
    
    // Handle authentication errors
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}