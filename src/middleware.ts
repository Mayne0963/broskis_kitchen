import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

async function verifySessionCookie(sessionCookie: string) {
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // 1. First: Handle www → apex domain redirect
  const host = req.headers.get("host") || "";
  if (host.startsWith("www.")) {
    const redirectUrl = new URL(req.url);
    redirectUrl.host = host.replace(/^www\./, "");
    return NextResponse.redirect(redirectUrl, 301);
  }

  // 2. Then: Handle API auth for /api/rewards routes
  if (url.pathname.startsWith("/api/rewards")) {
    if (process.env.NODE_ENV === "development") {
      // In dev: allow guests but attach fake token for testing
      (req as any).user = { id: "guest_dev", role: "guest" };
      return NextResponse.next();
    }

    // In production: require real auth
    const sessionCookie = req.cookies.get("session")?.value;
    if (!sessionCookie) {
      return new Response(
        JSON.stringify({ success: false, error: "UNAUTHORIZED" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const decodedClaims = await verifySessionCookie(sessionCookie);
    if (!decodedClaims) {
      return new Response(
        JSON.stringify({ success: false, error: "UNAUTHORIZED" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Attach user info to request for handlers
    (req as any).user = { 
      id: decodedClaims.uid, 
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      role: "customer" // Default role, can be enhanced with custom claims
    };
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"]
};