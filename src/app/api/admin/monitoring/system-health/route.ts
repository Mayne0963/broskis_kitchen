import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuth, requireAdmin } from '@/lib/middleware/error-handler';
import { db } from '@/lib/firebaseAdmin';

export const GET = withErrorHandler(async (request: NextRequest, context) => {
  // Require admin authentication
  const user = await requireAuth(request);
  requireAdmin(user);

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const hours = parseInt(url.searchParams.get('hours') || '24');
    
    // Calculate time range
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));

    // Query system health metrics from Firebase
    const healthQuery = db.collection('system_health')
      .where('timestamp', '>=', startTime.toISOString())
      .where('timestamp', '<=', endTime.toISOString())
      .orderBy('timestamp', 'desc')
      .limit(limit);

    const snapshot = await healthQuery.get();
    const healthMetrics = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // If no data in Firebase, return current system metrics
    if (healthMetrics.length === 0) {
      const currentMetrics = {
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
        activeConnections: 0, // Would need to track this separately
        responseTime: 0 // Would need to calculate from recent requests
      };
      
      return NextResponse.json([currentMetrics]);
    }

    return NextResponse.json(healthMetrics.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching system health metrics:', error);
    throw error;
  }
});