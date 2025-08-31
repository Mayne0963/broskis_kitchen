import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuth, requireAdmin } from '@/lib/middleware/error-handler';
import { logger } from '@/lib/services/logging-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request: NextRequest, context) => {
  // Require admin authentication
  const user = await requireAuth(request);
  requireAdmin(user);

  try {
    const url = new URL(request.url);
    const hours = parseInt(url.searchParams.get('hours') || '24');
    
    // Calculate time range
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));

    // Get log statistics using the logging service
    const stats = await logger.getLogStats({
      start: startTime.toISOString(),
      end: endTime.toISOString()
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching log statistics:', error);
    throw error;
  }
});