/**
 * Quota-friendly metrics service with caching and rate limiting
 * Prevents Firestore quota exhaustion through efficient data fetching
 */

import { adb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const metricsCache = new Map<string, { data: any; timestamp: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCounts = new Map<string, { count: number; windowStart: number }>();

interface MetricsOptions {
  useCache?: boolean;
  maxDocuments?: number;
  timeRange?: 'today' | 'week' | 'month' | 'all';
}

/**
 * Check if request is within rate limits
 */
export function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    // New window or first request
    requestCounts.set(clientId, { count: 1, windowStart: now });
    return true;
  }
  
  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  clientData.count++;
  return true;
}

/**
 * Get cached data if available and not expired
 */
function getCachedData(key: string): any | null {
  const cached = metricsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

/**
 * Cache data with timestamp
 */
function setCachedData(key: string, data: any): void {
  metricsCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get time range boundaries
 */
function getTimeRange(range: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  switch (range) {
    case 'today':
      return { start: today, end: now };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      return { start: weekStart, end: now };
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: monthStart, end: now };
    default:
      return null;
  }
}

/**
 * Fetch quota-friendly order metrics
 */
export async function getOrderMetrics(options: MetricsOptions = {}): Promise<any> {
  const { useCache = true, maxDocuments = 1000, timeRange = 'month' } = options;
  const cacheKey = `order-metrics-${timeRange}-${maxDocuments}`;
  
  // Check cache first
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }
  
  try {
    const ordersRef = adb.collection(COLLECTIONS.ORDERS);
    const timeRangeData = getTimeRange(timeRange);
    
    let queries: Promise<any>[] = [];
    
    if (timeRangeData) {
      // Time-bounded queries for efficiency
      queries = [
        // Orders in time range
        ordersRef
          .where('createdAt', '>=', timeRangeData.start)
          .where('createdAt', '<=', timeRangeData.end)
          .limit(maxDocuments)
          .get(),
        
        // Pending orders (always current)
        ordersRef
          .where('status', '==', 'pending')
          .limit(100)
          .get(),
      ];
    } else {
      // For 'all' time range, use pagination
      queries = [
        ordersRef.limit(maxDocuments).get(),
        ordersRef.where('status', '==', 'pending').limit(100).get(),
      ];
    }
    
    const [ordersSnapshot, pendingOrdersSnapshot] = await Promise.all(queries);
    
    // Process results efficiently
    let totalRevenue = 0;
    let totalOrders = 0;
    const userOrderCounts = new Map<string, number>();
    
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      totalOrders++;
      
      if (order.total && typeof order.total === 'number') {
        totalRevenue += order.total;
      }
      
      if (order.userId) {
        userOrderCounts.set(order.userId, (userOrderCounts.get(order.userId) || 0) + 1);
      }
    });
    
    const metrics = {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingOrders: pendingOrdersSnapshot.size,
      avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
      uniqueCustomers: userOrderCounts.size,
      avgOrdersPerCustomer: userOrderCounts.size > 0 ? Math.round((totalOrders / userOrderCounts.size) * 100) / 100 : 0,
      timeRange,
      documentsRead: ordersSnapshot.size + pendingOrdersSnapshot.size,
      fromCache: false
    };
    
    // Cache the results
    if (useCache) {
      setCachedData(cacheKey, metrics);
    }
    
    return metrics;
    
  } catch (error) {
    console.error('Error fetching order metrics:', error);
    throw new Error('Failed to fetch order metrics');
  }
}

/**
 * Fetch quota-friendly user metrics
 */
export async function getUserMetrics(options: MetricsOptions = {}): Promise<any> {
  const { useCache = true, maxDocuments = 500, timeRange = 'month' } = options;
  const cacheKey = `user-metrics-${timeRange}-${maxDocuments}`;
  
  // Check cache first
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }
  
  try {
    const usersRef = adb.collection(COLLECTIONS.USERS);
    const timeRangeData = getTimeRange(timeRange);
    
    let userQuery;
    if (timeRangeData && timeRange !== 'all') {
      userQuery = usersRef
        .where('createdAt', '>=', timeRangeData.start)
        .limit(maxDocuments)
        .get();
    } else {
      userQuery = usersRef.limit(maxDocuments).get();
    }
    
    const usersSnapshot = await userQuery;
    
    const metrics = {
      totalUsers: usersSnapshot.size,
      newUsers: timeRange === 'all' ? usersSnapshot.size : usersSnapshot.size,
      timeRange,
      documentsRead: usersSnapshot.size,
      fromCache: false
    };
    
    // Cache the results
    if (useCache) {
      setCachedData(cacheKey, metrics);
    }
    
    return metrics;
    
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    throw new Error('Failed to fetch user metrics');
  }
}

/**
 * Clear metrics cache
 */
export function clearMetricsCache(): void {
  metricsCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    cacheSize: metricsCache.size,
    cacheKeys: Array.from(metricsCache.keys()),
    cacheDuration: CACHE_DURATION
  };
}