import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuth, requireAdmin } from '@/lib/middleware/error-handler';
import { db } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request: NextRequest, context) => {
  // Require admin authentication
  const user = await requireAuth(request);
  requireAdmin(user);

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const severity = url.searchParams.get('severity');
    const hours = parseInt(url.searchParams.get('hours') || '24');
    const endpoint = url.searchParams.get('endpoint');
    
    // Calculate time range
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));

    // Build query
    let errorQuery = db.collection('error_logs')
      .where('timestamp', '>=', startTime.toISOString())
      .where('timestamp', '<=', endTime.toISOString());

    // Add filters
    if (severity) {
      errorQuery = errorQuery.where('severity', '==', severity);
    }

    if (endpoint) {
      errorQuery = errorQuery.where('context.endpoint', '==', endpoint);
    }

    // Order and limit
    errorQuery = errorQuery.orderBy('timestamp', 'desc').limit(limit);

    const snapshot = await errorQuery.get();
    const errorLogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(errorLogs);
  } catch (error) {
    console.error('Error fetching error logs:', error);
    throw error;
  }
});