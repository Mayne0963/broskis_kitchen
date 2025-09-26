import { NextRequest, NextResponse } from 'next/server'
import { expireOldPoints } from '@/lib/rewards'
import { headers } from 'next/headers'

/**
 * Cron job endpoint for expiring old points
 * Runs nightly to clean up points that are 30+ days old
 * 
 * This endpoint is protected by Vercel's cron authorization header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request from Vercel
    const headersList = headers()
    const authHeader = headersList.get('authorization')
    
    // Vercel cron jobs include a special authorization header
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting nightly point expiry cleanup...')
    
    // Run the point expiry cleanup
    const expiredCount = await expireOldPoints()
    
    console.log(`Point expiry cleanup completed. Expired ${expiredCount} point transactions.`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully expired ${expiredCount} point transactions`,
      expiredCount,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in point expiry cron job:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to expire points',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request)
}