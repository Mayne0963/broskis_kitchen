import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const response = NextResponse.next();

  // Global no-store for auth/admin routes
  if (url.pathname.startsWith("/api/auth") || 
      url.pathname.startsWith("/api/admin") || 
      url.pathname.startsWith("/admin")) {
    response.headers.set("Cache-Control", "no-store, private, max-age=0");
  }

  // Handle NextAuth.js admin routes (existing logic)
  if (url.pathname.startsWith("/admin")) {
    return response;
  }

  // Handle Firebase Auth routes
  const isFirebaseAuthRoute = [
    "/dashboard",
    "/profile", 
    "/orders",
    "/loyalty",
    "/rewards",
    "/cart",
    "/checkout"
  ].some(route => url.pathname.startsWith(route));

  const isAuthPage = [
    "/auth/login",
    "/auth/signup", 
    "/login"
  ].includes(url.pathname);

  if (isFirebaseAuthRoute || isAuthPage) {
    // Check for Firebase session cookie
    const sessionCookie = req.cookies.get('__session')?.value;
    let hasValidFirebaseSession = false;

    if (sessionCookie) {
      try {
        // For middleware (Edge Runtime), we'll do basic JWT structure validation
        // The actual verification happens in the page server components using Firebase Admin
        const parts = sessionCookie.split('.');
        if (parts.length === 3) {
          // Decode the payload to check basic structure and expiration
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          const now = Math.floor(Date.now() / 1000);
          
          // Check if token has required fields and is not expired
          if (payload.exp && payload.exp > now && payload.uid) {
            hasValidFirebaseSession = true;
            console.log(`[MIDDLEWARE] Valid session found for ${url.pathname}`);
          } else {
            console.log(`[MIDDLEWARE] Expired or invalid session for ${url.pathname}`);
          }
        }
      } catch (error) {
        console.log(`[MIDDLEWARE] Invalid session format for ${url.pathname}:`, error instanceof Error ? error.message : 'Unknown error');
      }

      // If session is invalid or expired, clear the cookie
      if (!hasValidFirebaseSession) {
        response.cookies.set('__session', '', { maxAge: 0, path: '/' });
      }
    }

    if (isAuthPage && hasValidFirebaseSession) {
      // User is authenticated but trying to access auth pages - redirect to dashboard
      console.log(`[MIDDLEWARE] Authenticated user accessing ${url.pathname}, redirecting to dashboard`);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (isFirebaseAuthRoute && !hasValidFirebaseSession) {
      // User is not authenticated but trying to access protected routes - redirect to login
      console.log(`[MIDDLEWARE] Unauthenticated user accessing ${url.pathname}, redirecting to login`);
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('next', url.pathname);
      return NextResponse.redirect(loginUrl);
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