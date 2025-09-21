export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, auth } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/services/logging-service';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    authentication: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    logging: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
  system: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      heapUsagePercent: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
    loadAverage?: number[];
  };
  checks: {
    name: string;
    status: 'pass' | 'fail';
    duration: number;
    error?: string;
  }[];
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: HealthCheckResult['checks'] = [];
  
  try {
    // Initialize health check result
    const healthCheck: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: { status: 'healthy' },
        authentication: { status: 'healthy' },
        logging: { status: 'healthy' }
      },
      system: {
        memoryUsage: {
          rss: 0,
          heapTotal: 0,
          heapUsed: 0,
          external: 0,
          heapUsagePercent: 0
        },
        cpuUsage: {
          user: 0,
          system: 0
        }
      },
      checks: []
    };

    // Collect system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    healthCheck.system.memoryUsage = {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      heapUsagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    };
    
    healthCheck.system.cpuUsage = {
      user: cpuUsage.user,
      system: cpuUsage.system
    };

    // Add load average on Unix systems
    if (process.platform !== 'win32') {
      try {
        const os = await import('os');
        healthCheck.system.loadAverage = os.loadavg();
      } catch (error) {
        // Ignore if os module is not available
      }
    }

    // Check database connectivity
    const dbCheckStart = Date.now();
    try {
      // Simple database connectivity test
      await adminDb.collection('health_check').limit(1).get();
      const dbDuration = Date.now() - dbCheckStart;
      
      healthCheck.services.database = {
        status: 'healthy',
        responseTime: dbDuration
      };
      
      checks.push({
        name: 'database_connectivity',
        status: 'pass',
        duration: dbDuration
      });
    } catch (error) {
      const dbDuration = Date.now() - dbCheckStart;
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      
      healthCheck.services.database = {
        status: 'unhealthy',
        responseTime: dbDuration,
        error: errorMessage
      };
      
      checks.push({
        name: 'database_connectivity',
        status: 'fail',
        duration: dbDuration,
        error: errorMessage
      });
      
      healthCheck.status = 'unhealthy';
    }

    // Check authentication service
    const authCheckStart = Date.now();
    try {
      // Test auth service by creating a custom token (this doesn't actually create a user)
      await auth.createCustomToken('health-check-test');
      const authDuration = Date.now() - authCheckStart;
      
      healthCheck.services.authentication = {
        status: 'healthy',
        responseTime: authDuration
      };
      
      checks.push({
        name: 'authentication_service',
        status: 'pass',
        duration: authDuration
      });
    } catch (error) {
      const authDuration = Date.now() - authCheckStart;
      const errorMessage = error instanceof Error ? error.message : 'Unknown auth error';
      
      healthCheck.services.authentication = {
        status: 'unhealthy',
        responseTime: authDuration,
        error: errorMessage
      };
      
      checks.push({
        name: 'authentication_service',
        status: 'fail',
        duration: authDuration,
        error: errorMessage
      });
      
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }

    // Check logging service
    const loggingCheckStart = Date.now();
    try {
      // Test logging service
      logger.debug('Health check test log', { healthCheck: true });
      const loggingDuration = Date.now() - loggingCheckStart;
      
      healthCheck.services.logging = {
        status: 'healthy',
        responseTime: loggingDuration
      };
      
      checks.push({
        name: 'logging_service',
        status: 'pass',
        duration: loggingDuration
      });
    } catch (error) {
      const loggingDuration = Date.now() - loggingCheckStart;
      const errorMessage = error instanceof Error ? error.message : 'Unknown logging error';
      
      healthCheck.services.logging = {
        status: 'unhealthy',
        responseTime: loggingDuration,
        error: errorMessage
      };
      
      checks.push({
        name: 'logging_service',
        status: 'fail',
        duration: loggingDuration,
        error: errorMessage
      });
      
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }

    // Check system resource thresholds
    const memoryThresholdCheck = Date.now();
    if (healthCheck.system.memoryUsage.heapUsagePercent > 90) {
      checks.push({
        name: 'memory_threshold',
        status: 'fail',
        duration: Date.now() - memoryThresholdCheck,
        error: `Memory usage at ${healthCheck.system.memoryUsage.heapUsagePercent.toFixed(1)}%`
      });
      healthCheck.status = 'unhealthy';
    } else if (healthCheck.system.memoryUsage.heapUsagePercent > 75) {
      checks.push({
        name: 'memory_threshold',
        status: 'fail',
        duration: Date.now() - memoryThresholdCheck,
        error: `Memory usage at ${healthCheck.system.memoryUsage.heapUsagePercent.toFixed(1)}%`
      });
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    } else {
      checks.push({
        name: 'memory_threshold',
        status: 'pass',
        duration: Date.now() - memoryThresholdCheck
      });
    }

    // Check disk space (if available)
    const diskCheckStart = Date.now();
    try {
      const fs = await import('fs');
      const stats = await fs.promises.statfs(process.cwd());
      const freeSpacePercent = (stats.bavail / stats.blocks) * 100;
      
      if (freeSpacePercent < 10) {
        checks.push({
          name: 'disk_space',
          status: 'fail',
          duration: Date.now() - diskCheckStart,
          error: `Free disk space at ${freeSpacePercent.toFixed(1)}%`
        });
        healthCheck.status = 'unhealthy';
      } else if (freeSpacePercent < 20) {
        checks.push({
          name: 'disk_space',
          status: 'fail',
          duration: Date.now() - diskCheckStart,
          error: `Free disk space at ${freeSpacePercent.toFixed(1)}%`
        });
        if (healthCheck.status === 'healthy') {
          healthCheck.status = 'degraded';
        }
      } else {
        checks.push({
          name: 'disk_space',
          status: 'pass',
          duration: Date.now() - diskCheckStart
        });
      }
    } catch (error) {
      // Disk check not available on this platform
      checks.push({
        name: 'disk_space',
        status: 'pass',
        duration: Date.now() - diskCheckStart,
        error: 'Disk check not available on this platform'
      });
    }

    healthCheck.checks = checks;

    // Determine HTTP status code based on health
    let statusCode = 200;
    if (healthCheck.status === 'degraded') {
      statusCode = 200; // Still operational but with issues
    } else if (healthCheck.status === 'unhealthy') {
      statusCode = 503; // Service unavailable
    }

    // Log health check if there are issues
    if (healthCheck.status !== 'healthy') {
      logger.warn('Health check failed', {
        status: healthCheck.status,
        failedChecks: checks.filter(check => check.status === 'fail'),
        duration: Date.now() - startTime
      }, 'health_check');
    }

    return NextResponse.json(healthCheck, { status: statusCode });
  } catch (error) {
    // Critical error during health check
    const errorMessage = error instanceof Error ? error.message : 'Unknown health check error';
    
    logger.error('Health check critical error', error, {
      duration: Date.now() - startTime
    }, 'health_check');

    const criticalHealthCheck: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: { status: 'unhealthy', error: 'Health check failed' },
        authentication: { status: 'unhealthy', error: 'Health check failed' },
        logging: { status: 'unhealthy', error: 'Health check failed' }
      },
      system: {
        memoryUsage: {
          rss: 0,
          heapTotal: 0,
          heapUsed: 0,
          external: 0,
          heapUsagePercent: 0
        },
        cpuUsage: {
          user: 0,
          system: 0
        }
      },
      checks: [{
        name: 'health_check_execution',
        status: 'fail',
        duration: Date.now() - startTime,
        error: errorMessage
      }]
    };

    return NextResponse.json(criticalHealthCheck, { status: 503 });
  }
}

// Simple health check endpoint for load balancers
export async function HEAD(request: NextRequest) {
  try {
    // Quick check - just verify the service is responding
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}