import { NextRequest, NextResponse } from "next/server"
import { getSessionCookieForMiddleware } from "./lib/auth/middlewareSession"
import { canAccessRoute, getDefaultRedirectPath, type UserRole } from "./lib/auth/rbacMiddleware"

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/orders',
  '/account',
  '/profile',
  '/admin',
  '/kitchen'
]

// Public-only routes that redirect authenticated users
const publicOnlyRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password'
]

// Role-specific route restrictions
const adminOnlyRoutes = ['/admin']
const kitchenOnlyRoutes = ['/kitchen']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const url = request.nextUrl.clone()

  // Check authentication status
  const user = await getSessionCookieForMiddleware()
  const isAuthenticated = !!user
  const isEmailVerified = user?.emailVerified || false
  const userRole = user?.role as UserRole || 'customer'

  // Handle protected routes
  if (protectedRoutes.some(route => path.startsWith(route))) {
    if (!isAuthenticated) {
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', path)
      return NextResponse.redirect(url)
    }
    
    if (!isEmailVerified) {
      url.pathname = '/auth/verify-email'
      return NextResponse.redirect(url)
    }

    // Check role-based access
    if (!canAccessRoute(userRole, path)) {
      // Redirect to appropriate dashboard based on user role
      url.pathname = getDefaultRedirectPath(userRole)
      return NextResponse.redirect(url)
    }
  }

  // Handle public-only routes
  if (publicOnlyRoutes.some(route => path === route)) {
    if (isAuthenticated && isEmailVerified) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || getDefaultRedirectPath(userRole)
      url.pathname = redirectTo
      url.searchParams.delete('redirect')
      return NextResponse.redirect(url)
    }
  }

  // Add security headers for infused menu
  if (path.startsWith("/infused-menu")) {
    const response = NextResponse.next()
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("Permissions-Policy", "camera=self")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*', 
    '/account/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/kitchen/:path*',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/infused-menu/:path*'
  ],
}
