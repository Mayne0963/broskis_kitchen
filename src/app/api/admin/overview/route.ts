import { NextRequest, NextResponse } from 'next/server';
import { fastAdminGuard } from '@/lib/auth/fastGuard';
import { db } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const preferredRegion = ["iad1"]; // Co-locate near US East for admin traffic

// Environment variable check
['FIREBASE_ADMIN_PROJECT_ID','FIREBASE_ADMIN_CLIENT_EMAIL','FIREBASE_ADMIN_PRIVATE_KEY']
  .forEach(k => { if (!process.env[k]) console.warn(`Missing env: ${k}`); });

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const overviewCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Get cached data if available and not expired
 */
function getCachedData(key: string): any | null {
  const cached = overviewCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

/**
 * Cache data with timestamp
 */
function setCachedData(key: string, data: any): void {
  overviewCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get comprehensive admin overview metrics
 */
export async function GET(request: NextRequest) {
  // Fast admin authentication guard
  const authResponse = await fastAdminGuard(request);
  if (authResponse) return authResponse;

  try {
    const { searchParams } = new URL(request.url);
    const useCache = searchParams.get('cache') !== 'false';
    const cacheKey = 'admin-overview-metrics';

    // Check cache first
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }

    // Get current date boundaries
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch data from multiple collections in parallel
    const [
      ordersSnapshot,
      usersSnapshot,
      activeUsersSnapshot,
      menuDropsSnapshot
    ] = await Promise.all([
      // All orders
      db.collection(COLLECTIONS.ORDERS).limit(1000).get(),
      
      // All users
      db.collection(COLLECTIONS.USERS).limit(500).get(),
      
      // Active users (users with orders in last 30 days)
      db.collection(COLLECTIONS.ORDERS)
        .where('createdAt', '>=', thirtyDaysAgo)
        .limit(500)
        .get(),
      
      // Menu drops (if collection exists)
      db.collection('menuDrops').limit(100).get().catch(() => ({ docs: [] }))
    ]);

    // Process orders data
    let totalRevenue = 0;
    let totalOrders = ordersSnapshot.size;
    const userOrderCounts = new Map<string, number>();
    
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      if (order.total && typeof order.total === 'number') {
        totalRevenue += order.total;
      }
      if (order.userId) {
        userOrderCounts.set(order.userId, (userOrderCounts.get(order.userId) || 0) + 1);
      }
    });

    // Process active users
    const activeUserIds = new Set();
    activeUsersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      if (order.userId) {
        activeUserIds.add(order.userId);
      }
    });

    // Process menu drops
    const activeDrops = menuDropsSnapshot.docs.filter(doc => {
      const drop = doc.data();
      return drop.status === 'active' || drop.status === 'live';
    }).length;

    // Calculate metrics
    const totalUsers = usersSnapshot.size;
    const activeUsers = activeUserIds.size;
    const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;
    const avgOrdersPerUser = userOrderCounts.size > 0 ? Math.round((totalOrders / userOrderCounts.size) * 100) / 100 : 0;

    const overviewData = {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeDrops,
      totalUsers,
      activeUsers,
      avgOrderValue,
      avgOrdersPerUser,
      timestamp: new Date().toISOString(),
      fromCache: false
    };

    // Cache the results
    if (useCache) {
      setCachedData(cacheKey, overviewData);
    }

    return NextResponse.json(overviewData);

  } catch (error) {
    console.error('Error fetching admin overview metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview metrics' },
      { status: 500 }
    );
  }
}