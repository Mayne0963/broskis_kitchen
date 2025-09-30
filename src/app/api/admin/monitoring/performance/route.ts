import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuth, requireAdmin } from '@/lib/middleware/error-handler';
import { db } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const GET = withErrorHandler(async (request: NextRequest, context) => {
  // Require admin authentication
  const user = await requireAuth(request);
  requireAdmin(user);

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const endpoint = url.searchParams.get('endpoint');
    const method = url.searchParams.get('method');
    const hours = parseInt(url.searchParams.get('hours') || '24');
    const minDuration = parseInt(url.searchParams.get('minDuration') || '0');
    
    // Calculate time range
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));

    // Build query
    let performanceQuery = db.collection('performance_metrics')
      .where('timestamp', '>=', startTime.toISOString())
      .where('timestamp', '<=', endTime.toISOString());

    // Add filters
    if (endpoint) {
      performanceQuery = performanceQuery.where('endpoint', '==', endpoint);
    }

    if (method) {
      performanceQuery = performanceQuery.where('method', '==', method);
    }

    if (minDuration > 0) {
      performanceQuery = performanceQuery.where('duration', '>=', minDuration);
    }

    // Order and limit
    performanceQuery = performanceQuery.orderBy('timestamp', 'desc').limit(limit);

    const snapshot = await performanceQuery.get();
    const performanceMetrics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate aggregated statistics
    const stats = {
      totalRequests: performanceMetrics.length,
      averageResponseTime: performanceMetrics.length > 0 
        ? performanceMetrics.reduce((sum, metric) => sum + metric.duration, 0) / performanceMetrics.length 
        : 0,
      slowestRequest: performanceMetrics.length > 0 
        ? Math.max(...performanceMetrics.map(m => m.duration)) 
        : 0,
      fastestRequest: performanceMetrics.length > 0 
        ? Math.min(...performanceMetrics.map(m => m.duration)) 
        : 0,
      errorRate: performanceMetrics.length > 0 
        ? (performanceMetrics.filter(m => m.statusCode >= 400).length / performanceMetrics.length) * 100 
        : 0,
      endpointBreakdown: {} as Record<string, { count: number; avgDuration: number }>
    };

    // Calculate endpoint breakdown
    const endpointGroups = performanceMetrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(endpointGroups).forEach(([endpoint, metrics]) => {
      stats.endpointBreakdown[endpoint] = {
        count: metrics.length,
        avgDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
      };
    });

    return NextResponse.json({
      metrics: performanceMetrics,
      stats
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
});