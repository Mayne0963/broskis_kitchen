import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = { 
  matcher: ["/api/auth/:path*", "/api/admin/:path*", "/admin/:path*", "/api/rewards/:path*"] 
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

  // Guard /api/rewards routes
  if (url.pathname.startsWith("/api/rewards")) {
    console.log(`[MIDDLEWARE] Processing ${url.pathname}, NODE_ENV: ${process.env.NODE_ENV}`);
    
    if (process.env.NODE_ENV === "development") {
      // In dev: allow guests but attach fake token for testing
      console.log(`[MIDDLEWARE] Development mode - attaching fake user`);
      response.headers.set('x-dev-user', JSON.stringify({ id: "guest_dev", role: "guest" }));
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
    response.headers.set('x-user-token', JSON.stringify(token));
    return response;
  }

  return response;
}
