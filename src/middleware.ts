import { NextRequest, NextResponse } from 'next/server'

// Middleware configuration
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all pages except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// Simple logging function for middleware (Edge Runtime compatible)
function logToConsole(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  }
  console.log(`[${level.toUpperCase()}] ${timestamp}: ${message}`, data ? JSON.stringify(data) : '')
}

export function middleware(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  // Extract request information
  const { pathname, search } = request.nextUrl
  const method = request.method
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const referer = request.headers.get('referer') || 'direct'
  
  // Log API requests
  if (pathname.startsWith('/api/')) {
    logToConsole('info', 'API Request', {
      method,
      url: pathname + search,
      userAgent,
      ip,
      referer,
      requestId
    })
    
    // Log security events for sensitive endpoints
    if (pathname.includes('/admin/') || pathname.includes('/auth/')) {
      logToConsole('warn', 'Sensitive endpoint access', {
        endpoint: pathname,
        method,
        ip,
        userAgent,
        requestId
      })
    }
  }
  
  // Continue with the request
  const response = NextResponse.next()
  
  // Add request ID to response headers for tracing
  response.headers.set('x-request-id', requestId)
  
  // Add security headers
  response.headers.set('x-frame-options', 'DENY')
  response.headers.set('x-content-type-options', 'nosniff')
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  response.headers.set('x-xss-protection', '1; mode=block')
  
  // Log response for API routes
  if (pathname.startsWith('/api/')) {
    const duration = Date.now() - startTime
    
    // Log performance metrics
    logToConsole('info', 'API Response', {
      endpoint: pathname,
      method,
      duration,
      statusCode: response.status,
      requestId
    })
    
    // Log slow requests
    if (duration > 1000) {
      logToConsole('warn', 'Slow API request detected', {
        endpoint: pathname,
        method,
        duration,
        requestId
      })
    }
    
    // Log error responses
    if (response.status >= 400) {
      logToConsole('error', 'API error response', {
        endpoint: pathname,
        method,
        statusCode: response.status,
        duration,
        requestId
      })
    }
  }
  
  return response
}
