import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Enhanced middleware configuration with comprehensive route matching
export const config = { 
  matcher: [
    // API routes that need protection
    "/api/auth/:path*", 
    "/api/admin/:path*", 
    "/api/rewards/:path*",
    // Firebase Auth protected routes
    "/dashboard/:path*",
    "/profile/:path*",
    "/orders/:path*",
    "/loyalty/:path*",
    "/rewards/:path*",
    "/cart/:path*",
    "/checkout/:path*",
    // Auth pages that should redirect if authenticated
    "/auth/login",
    "/auth/signup",
    "/login"
  ] 
};

// Enhanced authentication result interface
interface AuthResult {
  isAuthenticated: boolean;
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
    role: string;
  };
  sessionValid: boolean;
  emailVerified: boolean;
}

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile", 
  "/orders",
  "/loyalty",
  "/rewards",
  "/cart",
  "/checkout"
];

// Auth pages that should redirect if user is already authenticated
const AUTH_PAGES = [
  "/auth/login",
  "/auth/signup", 
  "/login"
];

// Routes that require email verification
const EMAIL_VERIFICATION_REQUIRED_ROUTES = [
  "/dashboard",
  "/profile",
  "/orders",
  "/loyalty",
  "/rewards",
  "/checkout"
];

// Edge-compatible JWT validation for middleware
async function validateJWTStructure(sessionCookie: string): Promise<any> {
  try {
    const parts = sessionCookie.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT structure');
    }
    
    // Decode the payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch (error) {
    throw new Error('Invalid JWT format');
  }
}

// Enhanced authentication verification for Edge Runtime
async function verifyAuthentication(req: NextRequest): Promise<AuthResult> {
  const sessionCookie = req.cookies.get('__session')?.value;
  
  if (!sessionCookie) {
    return { 
      isAuthenticated: false, 
      sessionValid: false, 
      emailVerified: false 
    };
  }
  
  try {
    // Edge-compatible JWT validation
    const payload = await validateJWTStructure(sessionCookie);
    const now = Math.floor(Date.now() / 1000);
    
    // Validate token expiration and required fields
    if (!payload.exp || payload.exp <= now || !payload.uid) {
      return { 
        isAuthenticated: false, 
        sessionValid: false, 
        emailVerified: false 
      };
    }
    
    return {
      isAuthenticated: true,
      sessionValid: true,
      emailVerified: payload.email_verified || false,
      user: {
        uid: payload.uid,
        email: payload.email,
        emailVerified: payload.email_verified || false,
        role: payload.role || 'customer'
      }
    };
  } catch (error) {
    console.log(`[MIDDLEWARE] JWT validation failed:`, error instanceof Error ? error.message : 'Unknown error');
    return { 
      isAuthenticated: false, 
      sessionValid: false, 
      emailVerified: false 
    };
  }
}

// Handle protected route access
function handleProtectedRoute(req: NextRequest, response: NextResponse, authResult: AuthResult): NextResponse {
  const url = req.nextUrl;
  
  if (!authResult.isAuthenticated || !authResult.sessionValid) {
    // Clear invalid session cookie
    response.cookies.set('__session', '', { 
      maxAge: 0, 
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    console.log(`[MIDDLEWARE] Unauthenticated access to ${url.pathname}, redirecting to login`);
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('next', url.pathname + url.search);
    loginUrl.searchParams.set('error', 'authentication_required');
    return NextResponse.redirect(loginUrl);
  }
  
  // Check email verification requirement
  const requiresEmailVerification = EMAIL_VERIFICATION_REQUIRED_ROUTES.some(route => 
    url.pathname.startsWith(route)
  );
  
  if (requiresEmailVerification && !authResult.emailVerified) {
    console.log(`[MIDDLEWARE] Email verification required for ${url.pathname}`);
    const verifyUrl = new URL('/auth/verify-email', req.url);
    verifyUrl.searchParams.set('next', url.pathname + url.search);
    verifyUrl.searchParams.set('error', 'email_verification_required');
    return NextResponse.redirect(verifyUrl);
  }
  
  // Attach user context to response headers for server components
  if (authResult.user) {
    response.headers.set('x-user-context', JSON.stringify(authResult.user));
  }
  
  console.log(`[MIDDLEWARE] Authorized access to ${url.pathname} for user ${authResult.user?.uid}`);
  return response;
}

// Handle authentication page access
function handleAuthRoute(req: NextRequest, response: NextResponse, authResult: AuthResult): NextResponse {
  const url = req.nextUrl;
  
  if (authResult.isAuthenticated && authResult.sessionValid) {
    // User is authenticated but trying to access auth pages - redirect to dashboard
    console.log(`[MIDDLEWARE] Authenticated user accessing ${url.pathname}, redirecting to dashboard`);
    const dashboardUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  // Allow access to auth pages for unauthenticated users
  console.log(`[MIDDLEWARE] Allowing unauthenticated access to ${url.pathname}`);
  return response;
}

// Check if route is protected
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

// Check if route is an auth page
function isAuthRoute(pathname: string): boolean {
  return AUTH_PAGES.includes(pathname);
}

// Enhanced middleware with comprehensive verification
export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const response = NextResponse.next();

  // Performance optimization: Set cache headers for auth-sensitive routes
  if (isProtectedRoute(url.pathname) || isAuthRoute(url.pathname)) {
    response.headers.set("Cache-Control", "no-store, private, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  // Global no-store for auth/admin API routes
  if (url.pathname.startsWith("/api/auth") || 
      url.pathname.startsWith("/api/admin") || 
      url.pathname.startsWith("/admin")) {
    response.headers.set("Cache-Control", "no-store, private, max-age=0");
  }

  // Handle NextAuth.js admin routes (existing logic)
  if (url.pathname.startsWith("/admin")) {
    return response;
  }

  // Enhanced Firebase Auth route handling
  if (isProtectedRoute(url.pathname) || isAuthRoute(url.pathname)) {
    const authResult = await verifyAuthentication(req);
    
    if (isProtectedRoute(url.pathname)) {
      return handleProtectedRoute(req, response, authResult);
    }
    
    if (isAuthRoute(url.pathname)) {
      return handleAuthRoute(req, response, authResult);
    }
  }

  // Guard /api/rewards routes (existing logic)
  if (url.pathname.startsWith("/api/rewards")) {
    console.log(`[MIDDLEWARE] Processing ${url.pathname}, NODE_ENV: ${process.env.NODE_ENV}`);
    
    // Allow public endpoints without authentication
    const publicEndpoints = ['/api/rewards/status', '/api/rewards/health'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => url.pathname === endpoint);
    
    if (isPublicEndpoint) {
      console.log(`[MIDDLEWARE] Public endpoint ${url.pathname} - allowing without auth`);
      return response;
    }
    
    if (process.env.NODE_ENV === "development") {
      // In dev: allow guests but attach fake token for testing
      console.log(`[MIDDLEWARE] Development mode - attaching fake user`);
      response.headers.set('x-dev-user', JSON.stringify({ id: "guest_dev", role: "guest" }));
      return response;
    }

    // In production: require real auth for protected endpoints
    const token = await getToken({ req });
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "UNAUTHORIZED" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Attach token to request for handlers
    response.headers.set('x-user-token', JSON.stringify(token));
    return response;
  }

  return response;
}