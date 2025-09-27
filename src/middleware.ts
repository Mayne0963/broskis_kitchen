import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Only guard /api/rewards routes
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