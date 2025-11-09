import { NextRequest, NextResponse } from 'next/server'

/**
 * Health Check API Endpoint
 * Used by deployment delay mechanism to verify service availability
 */

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.1.0'
    }

    // Check if critical services are available
    const checks = {
      database: await checkDatabase(),
      externalServices: await checkExternalServices(),
      memory: health.memory.heapUsed < 512 * 1024 * 1024 // Less than 512MB
    }

    const allHealthy = Object.values(checks).every(check => check === true)

    return NextResponse.json({
      ...health,
      checks,
      overall: allHealthy ? 'healthy' : 'degraded'
    }, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    // Add database connectivity check here if needed
    // For now, return true as we're using Firebase/Firestore
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

async function checkExternalServices(): Promise<boolean> {
  try {
    // Check critical external services
    // For now, return true as basic check
    return true
  } catch (error) {
    console.error('External services health check failed:', error)
    return false
  }
}