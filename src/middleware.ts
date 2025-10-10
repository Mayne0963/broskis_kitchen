import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*).*)"]
};