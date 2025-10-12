import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = { 
  matcher: ["/api/auth/:path*", "/api/admin/:path*", "/admin/:path*", "/api/rewards/:path*"] 
};

// NOTE: 
// For best performance, let the server page guard handle role checks.
// Admin routes use lightweight middleware - pages handle authentication.
// This middleware focuses on caching and basic route protection.
export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const response = NextResponse.next();

  // Global no-store for auth/admin routes
  if (url.pathname.startsWith("/api/auth") || 
      url.pathname.startsWith("/api/admin") || 
      url.pathname.startsWith("/admin")) {
    response.headers.set("Cache-Control", "no-store, private, max-age=0");
  }

  // Lightweight admin route handling - let pages handle auth
  if (url.pathname.startsWith("/admin")) {
    return response;
  }

  // Guard /api/rewards routes (but allow some public endpoints)
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
