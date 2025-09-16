export const dynamic = "force-dynamic";
// If your project supports edge runtime, enable it; otherwise keep node:
// export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("bk_session");
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { ok: false },
        { 
          status: 401,
          headers: { "Cache-Control": "no-store" }
        }
      );
    }
    
    // Validate session token (simplified for demo)
    const isValidSession = sessionCookie.value.length > 10;
    
    if (!isValidSession) {
      return NextResponse.json(
        { ok: false },
        { 
          status: 401,
          headers: { "Cache-Control": "no-store" }
        }
      );
    }
    
    // Generate new session token (simplified)
    const newSessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response = NextResponse.json(
      { ok: true },
      { 
        status: 200,
        headers: { "Cache-Control": "no-store" }
      }
    );
    
    // Set cookie with proper attributes
    response.cookies.set("bk_session", newSessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false },
      { 
        status: 401,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 204, 
    headers: { "Cache-Control": "no-store" } 
  });
}