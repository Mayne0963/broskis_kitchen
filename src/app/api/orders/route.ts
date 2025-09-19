export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, adminAuth } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Order } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { isAdmin } from '@/lib/rbac';
import { cookies } from 'next/headers';

/**
 * Extracts ID token from request headers or cookies
 */
async function extractIdToken(request: NextRequest): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // Try session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session');
  if (sessionCookie) {
    return sessionCookie.value;
  }

  // Try __session cookie (Firebase hosting)
  const firebaseSession = cookieStore.get('__session');
  if (firebaseSession) {
    return firebaseSession.value;
  }

  return null;
}

/**
 * Aggregates global KPI data for admin users
 */
async function aggregateGlobalKPIs() {
  const db = getAdminDb();
  
  try {
    // Get total orders count
    const ordersSnapshot = await db.collection(COLLECTIONS.ORDERS).count().get();
    const totalOrders = ordersSnapshot.data().count;
    
    // Get revenue from completed orders
    const completedOrdersSnapshot = await db
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
    const recentOrdersSnapshot = await db
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
    // Extract and verify authentication token
    const idToken = await extractIdToken(request);
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role || 'customer';
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine') === '1';
    const wantKpi = searchParams.get('kpi') === '1';
    
    const db = getAdminDb();
    
    // Handle KPI request (admin only)
    if (wantKpi) {
      if (!isAdmin(userRole)) {
        return NextResponse.json(
          { error: 'forbidden' },
          { status: 403 }
        );
      }
      
      const kpi = await aggregateGlobalKPIs();
      return NextResponse.json({ kpi });
    }
    
    // Handle user's own orders
    if (mine) {
      const ordersSnapshot = await db
        .collection(COLLECTIONS.ORDERS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      const orders = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt);
        const total = data.total || 0;
        
        return {
          id: doc.id,
          date: createdAt.toISOString().slice(0, 10),
          items: data.items?.map((item: any) => ({
            name: item.name,
            qty: item.qty
          })) || [],
          total,
          totalFormatted: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(total / 100),
          status: data.status || 'processing'
        };
      });
      
      return NextResponse.json({ orders });
    }
    
    // Default behavior: only allow admins to see all orders
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { error: 'forbidden' },
        { status: 403 }
      );
    }
    
    // Admin can see all orders (limited to 100)
    const allOrdersSnapshot = await db
      .collection(COLLECTIONS.ORDERS)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const orders = allOrdersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      };
    });
    
    return NextResponse.json({ orders });
    
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