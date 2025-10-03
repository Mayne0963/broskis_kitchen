import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isUserAdmin } from "@/lib/auth/roleUtils";

export const config = { 
  matcher: ["/api/auth/:path*", "/api/admin/:path*", "/admin/:path*", "/api/rewards/:path*"] 
};

const rateLimitMap = new Map();

function isRateLimited(ip: string, limit = 10, window = 60000): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];
  const validRequests = userRequests.filter((time: number) => now - time < window);
  
  if (validRequests.length >= limit) return true;
  
  validRequests.push(now);
  rateLimitMap.set(ip, validRequests);
  return false;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const response = NextResponse.next();

  if (url.pathname.startsWith("/admin")) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (isRateLimited(ip)) {
    return new Response("Too Many Requests", { status: 429 });
  }
}

  // Global no-store for auth/admin routes
  if (url.pathname.startsWith("/api/auth") || 
      url.pathname.startsWith("/api/admin") || 
      url.pathname.startsWith("/admin")) {
    response.headers.set("Cache-Control", "no-store, private, max-age=0");
  }

  // NEW: Guard /admin/* page routes (not just API routes)
  if (url.pathname.startsWith("/admin") && !url.pathname.startsWith("/admin/signin")) {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token?.user) {
      return NextResponse.redirect(new URL("/admin/signin?next=" + encodeURIComponent(url.pathname), req.url));
    }
    
    if (!isUserAdmin(token.user)) {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  // Guard /api/rewards routes
  if (url.pathname.startsWith("/api/rewards")) {
    console.log(`[MIDDLEWARE] Processing ${url.pathname}, NODE_ENV: ${process.env.NODE_ENV}`);
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[MIDDLEWARE] Development mode - attaching fake user`);
      response.headers.set('x-dev-user', JSON.stringify({ id: "guest_dev", role: "guest" }));
      return response;
    }

    const token = await getToken({ req });
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "UNAUTHORIZED" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    response.headers.set('x-user-token', JSON.stringify(token));
    return response;
  }

  return response;
}