import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

interface SessionUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  role: string;
  permissions?: string[];
}

interface AuthResult {
  isAuthenticated: boolean;
  user?: SessionUser;
  sessionValid: boolean;
  emailVerified: boolean;
}

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/orders',
  '/loyalty',
  '/rewards',
  '/cart',
  '/checkout'
];

// Auth routes that should redirect if already authenticated
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/login',
  '/signup'
];

// Routes that require email verification
const EMAIL_VERIFICATION_REQUIRED_ROUTES = [
  '/dashboard',
  '/profile',
  '/orders',
  '/loyalty',
  '/checkout'
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

function requiresEmailVerification(pathname: string): boolean {
  return EMAIL_VERIFICATION_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
}

// Edge-compatible JWT validation
async function validateJWTStructure(token: string): Promise<any> {
  try {
    // Basic JWT structure validation for Edge runtime
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT structure');
    }
    
    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    
    return payload;
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
}

async function verifyAuthentication(req: NextRequest): Promise<AuthResult> {
  const sessionCookie = req.cookies.get('__session')?.value;
  
  if (!sessionCookie) {
    return { isAuthenticated: false, sessionValid: false, emailVerified: false };
  }
  
  try {
    // Edge-compatible JWT validation
    const payload = await validateJWTStructure(sessionCookie);
    const now = Math.floor(Date.now() / 1000);
    
    if (!payload.exp || payload.exp <= now || !payload.uid) {
      return { isAuthenticated: false, sessionValid: false, emailVerified: false };
    }
    
    return {
      isAuthenticated: true,
      sessionValid: true,
      emailVerified: payload.email_verified || false,
      user: {
        uid: payload.uid,
        email: payload.email,
        emailVerified: payload.email_verified || false,
        name: payload.name,
        role: payload.role || 'customer',
        permissions: payload.permissions || []
      }
    };
  } catch (error) {
    console.error('Session verification failed:', error);
    return { isAuthenticated: false, sessionValid: false, emailVerified: false };
  }
}

function handleProtectedRoute(req: NextRequest, response: NextResponse, authResult: AuthResult): NextResponse {
  const url = req.nextUrl;
  
  if (!authResult.isAuthenticated || !authResult.user) {
    // Clear invalid session cookie
    if (!authResult.sessionValid) {
      response.cookies.delete('__session');
    }
    
    // Redirect to login with return URL
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnUrl', url.pathname + url.search);
    loginUrl.searchParams.set('error', 'authentication_required');
    return NextResponse.redirect(loginUrl);
  }
  
  // Check email verification requirement
  if (requiresEmailVerification(url.pathname) && !authResult.emailVerified) {
    const verifyUrl = new URL('/auth/verify-email', req.url);
    verifyUrl.searchParams.set('returnUrl', url.pathname + url.search);
    verifyUrl.searchParams.set('error', 'email_verification_required');
    return NextResponse.redirect(verifyUrl);
  }
  
  // Attach user context to request headers for server components
  response.headers.set('x-user-id', authResult.user.uid);
  response.headers.set('x-user-email', authResult.user.email);
  response.headers.set('x-user-role', authResult.user.role);
  response.headers.set('x-user-verified', authResult.emailVerified.toString());
  
  return response;
}

function handleAuthRoute(req: NextRequest, response: NextResponse, authResult: AuthResult): NextResponse {
  const url = req.nextUrl;
  
  // If user is already authenticated, redirect to dashboard
  if (authResult.isAuthenticated && authResult.user) {
    const returnUrl = url.searchParams.get('returnUrl');
    const redirectUrl = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }
  
  return response;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const response = NextResponse.next();
  
  // 1. First: Handle www → apex domain redirect
  const host = req.headers.get("host") || "";
  if (host.startsWith("www.")) {
    const redirectUrl = new URL(req.url);
    redirectUrl.host = host.replace(/^www\./, "");
    return NextResponse.redirect(redirectUrl, 301);
  }

  // 2. Performance optimization: Set cache headers for auth/protected routes
  if (isProtectedRoute(url.pathname) || isAuthRoute(url.pathname)) {
    response.headers.set("Cache-Control", "no-store, private, max-age=0");
  }

  // 3. Handle authentication verification
  const authResult = await verifyAuthentication(req);

  // 4. Handle protected routes
  if (isProtectedRoute(url.pathname)) {
    return handleProtectedRoute(req, response, authResult);
  }

  // 5. Handle auth routes (login/signup)
  if (isAuthRoute(url.pathname)) {
    return handleAuthRoute(req, response, authResult);
  }

  // 6. Handle API auth for /api/rewards routes
  if (url.pathname.startsWith("/api/rewards")) {
    if (process.env.NODE_ENV === "development") {
      // In dev: allow guests but attach fake token for testing
      (req as any).user = { id: "guest_dev", role: "guest" };
      return response;
    }

    // In production: require real auth
    const token = await getToken({ req });
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "UNAUTHORIZED" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Attach token to request for handlers
    (req as any).user = token;
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes (except /api/rewards)
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Include specific API routes that need auth
    "/api/rewards/:path*"
  ]
};