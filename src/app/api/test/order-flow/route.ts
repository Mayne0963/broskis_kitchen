import { NextRequest, NextResponse } from 'next/server';
import { runOrderFlowTests } from '@/lib/testing/order-flow-test';
import { logger } from '@/lib/services/logging-service';
import { withErrorHandler } from '@/lib/middleware/error-handler';
import { withRateLimit } from '@/lib/middleware/rate-limiter';
import { requireAuth, requireAdmin } from '@/lib/middleware/error-handler';

// POST /api/test/order-flow - Run end-to-end order flow tests
export const POST = withErrorHandler(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        // Require admin authentication for running tests
        const user = await requireAuth(request);
        await requireAdmin(user);

        // Only allow in development or staging environments
        if (process.env.NODE_ENV === 'production' && process.env.ENVIRONMENT !== 'staging') {
          return NextResponse.json(
            { error: 'Tests can only be run in development or staging environments' },
            { status: 403 }
          );
        }

        logger.info('Starting end-to-end order flow tests', {
          userId: user.uid,
          environment: process.env.NODE_ENV
        });

        // Run the tests
        const testReport = await runOrderFlowTests();

        logger.info('End-to-end tests completed', {
          userId: user.uid
        });

        return NextResponse.json({
          success: true,
          report: testReport,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to run end-to-end tests', error);
        
        return NextResponse.json(
          { 
            error: 'Failed to run tests',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    },
    'strict'
  )
);

// GET /api/test/order-flow - Get test status and recent results
export const GET = withErrorHandler(
  withRateLimit(
    async (request: NextRequest) => {
      try {
        const user = await requireAuth(request);
        await requireAdmin(user);

        // Get recent test results from logs
        const recentTests = await logger.queryLogs({
          source: 'testing',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
          limit: 10
        });

        const testHistory = recentTests
          .filter(log => log.message.includes('End-to-end tests completed'))
          .map(log => ({
            timestamp: log.timestamp,
            userId: log.metadata?.userId,
            summary: log.metadata?.summary
          }));

        return NextResponse.json({
          success: true,
          testHistory,
          environment: process.env.NODE_ENV,
          canRunTests: process.env.NODE_ENV !== 'production' || process.env.ENVIRONMENT === 'staging'
        });
      } catch (error) {
        logger.error('Failed to get test status', error);
        
        return NextResponse.json(
          { 
            error: 'Failed to get test status',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    },
    'general'
  )
);