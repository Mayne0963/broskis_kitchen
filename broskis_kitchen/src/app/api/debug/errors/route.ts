import { NextRequest, NextResponse } from 'next/server'
import { handleServerError } from '@/lib/utils/errorLogger'

// Debug endpoint to help surface server rendering errors
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const testType = searchParams.get('test')

    switch (testType) {
      case 'server-error':
        throw new Error('Test server error with digest')
      
      case 'async-error':
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Test async error')), 100)
        })
        break
      
      case 'fetch-error':
        await fetch('https://nonexistent-domain-12345.com/api/test')
        break
      
      case 'json-error':
        JSON.parse('invalid json {')
        break
      
      default:
        return NextResponse.json({
          message: 'Debug endpoint active',
          availableTests: [
            'server-error',
            'async-error', 
            'fetch-error',
            'json-error'
          ],
          usage: 'Add ?test=<testType> to trigger specific errors',
          environment: process.env.NODE_ENV
        })
    }

    return NextResponse.json({ message: 'Test completed without error' })
  } catch (error) {
    const errorDetails = handleServerError(error as Error, 'Debug API endpoint')
    
    return NextResponse.json(
      {
        error: 'Debug error triggered',
        details: errorDetails,
        message: 'This is a test error for debugging purposes'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for testing client-side error reporting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { error, context, additionalInfo } = body

    // Log the client-side error
    const errorDetails = handleServerError(
      new Error(error.message || 'Client-side error'),
      context || 'Client error report'
    )

    return NextResponse.json({
      message: 'Client error logged successfully',
      errorId: errorDetails.digest,
      timestamp: errorDetails.timestamp
    })
  } catch (error) {
    const errorDetails = handleServerError(error as Error, 'Debug API POST')
    
    return NextResponse.json(
      {
        error: 'Failed to log client error',
        details: errorDetails
      },
      { status: 500 }
    )
  }
}