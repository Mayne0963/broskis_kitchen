import { NextRequest, NextResponse } from 'next/server'
import { csrfProtection } from '@/lib/security/csrf'
import { applyRateLimit, createRateLimitResponse } from '@/lib/security/rateLimiter'

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimit = applyRateLimit(request, 'api')
    
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.retryAfter || 60)
    }

    const sessionId = request.cookies.get('session')?.value
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      )
    }

    const token = csrfProtection.createTokenForSession(sessionId)
    
    const response = NextResponse.json({ success: true })
    
    // Set CSRF token in header and cookie
    response.headers.set('X-CSRF-Token', token)
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 // 1 hour
    })

    // Add rate limit headers
    Object.entries(rateLimit.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response

  } catch (error) {
    console.error('CSRF token generation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}