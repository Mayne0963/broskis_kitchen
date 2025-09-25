import { NextRequest, NextResponse } from 'next/server'

// Middleware configuration
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match admin routes specifically
    '/admin',
    '/admin/:path*',
    // Match protected user routes
    '/profile',
    '/dashboard',
    '/dashboard/:path*',
    '/dashboard-standalone',
    '/dashboard-standalone/:path*',
    '/account',
    '/account/:path*',
    '/orders',
    '/rewards',
    '/loyalty',
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
  
  // Debug logging
  console.log(`[MIDDLEWARE] ${method} ${pathname} - cookies:`, request.cookies.getAll().map(c => c.name))
  
  // Protected user routes (requires any valid session)
  const protectedUserRoutes = ['/profile', '/dashboard', '/dashboard-standalone', '/account', '/orders', '/rewards', '/loyalty']
  const isProtectedUserRoute = protectedUserRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  
  if (isProtectedUserRoute) {
    const sessionCookie = request.cookies.get('session')?.value || request.cookies.get('__session')?.value
    if (!sessionCookie) {
        console.log('[MIDDLEWARE] No session cookie found for protected route:', pathname)
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl, 302)
      }
    
    // Validate session token format and expiration
    try {
      const parts = sessionCookie.split('.')
      if (parts.length !== 3) {
        console.log('[MIDDLEWARE] Invalid session token format for protected route:', pathname)
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl, 302)
      }
      
      // Decode and validate payload
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      while (base64.length % 4) {
        base64 += '='
      }
      const payload = JSON.parse(atob(base64))
      
      // Check if token is expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        console.log('[MIDDLEWARE] Expired session token for protected route:', pathname)
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl, 302)
      }
      
      // Check if required fields are present
      if (!payload.uid || !payload.role) {
        console.log('[MIDDLEWARE] Invalid session payload for protected route:', pathname)
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl, 302)
      }
      
      console.log('[MIDDLEWARE] Valid session for protected route access:', { uid: payload.uid, role: payload.role, path: pathname })
    } catch (error) {
      console.log('[MIDDLEWARE] Error validating session for protected route:', error)
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl, 302)
    }
  }
  
  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // TEMPORARY: Bypass admin auth in development for testing
    if (process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH_FOR_TESTING === 'true') {
      console.log('[MIDDLEWARE] Bypassing admin auth for testing:', pathname)
      // Continue without auth check
    }
    // Allow /admin/health to be public
    else if (pathname === '/admin/health') {
      // Continue without auth check
    } else {
      // Check for session cookie and validate admin role
      const sessionCookie = request.cookies.get('session')?.value || request.cookies.get('__session')?.value
      if (!sessionCookie) {
        console.log('[MIDDLEWARE] No session cookie found for admin route:', pathname)
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl, 302)
      }
      
      // Validate admin role by checking session
      try {
        console.log('[MIDDLEWARE] Validating session cookie:', sessionCookie.substring(0, 50) + '...')
        // For Edge runtime, we need to validate the session differently
        // We'll decode the JWT to check the role claim
        const parts = sessionCookie.split('.')
        console.log('[MIDDLEWARE] JWT parts count:', parts.length)
        
        if (parts.length === 3) {
          // Properly decode base64url payload with padding
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          // Add padding if needed
          while (base64.length % 4) {
            base64 += '='
          }
          console.log('[MIDDLEWARE] Decoding base64 payload:', base64.substring(0, 50) + '...')
          const payload = JSON.parse(atob(base64))
          console.log('[MIDDLEWARE] Decoded payload:', payload)
          const userRole = payload.role || 'customer'
          
          if (userRole !== 'admin') {
            console.log('[MIDDLEWARE] Non-admin user attempting admin access:', { role: userRole, path: pathname })
            const loginUrl = new URL('/auth/login', request.url)
            loginUrl.searchParams.set('from', pathname)
            loginUrl.searchParams.set('error', 'admin_required')
            return NextResponse.redirect(loginUrl, 302)
          }
          
          console.log('[MIDDLEWARE] Admin access granted:', { role: userRole, path: pathname })
        } else {
          console.log('[MIDDLEWARE] Invalid session token format for admin route:', pathname)
          const loginUrl = new URL('/auth/login', request.url)
          loginUrl.searchParams.set('from', pathname)
          return NextResponse.redirect(loginUrl, 302)
        }
      } catch (error) {
        console.log('[MIDDLEWARE] Error validating admin session:', error)
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl, 302)
      }
    }
  }
  
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
