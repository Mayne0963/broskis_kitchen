export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { getServerUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getServerUser();
    return NextResponse.json({ 
      ok: !!user, 
      user: user ? {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.roles?.[0] || 'customer'
      } : null 
    }, {
      headers: { 
        "cache-control": "no-store, private, max-age=0",
        "content-type": "application/json"
      }
    });
  } catch (error) {
    console.error("Session GET error:", error);
    return NextResponse.json({ ok: false, user: null }, {
      headers: { 
        "cache-control": "no-store, private, max-age=0",
        "content-type": "application/json"
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if email is verified (skip for Google OAuth users)
    const isGoogleUser = decodedToken.firebase?.sign_in_provider === 'google.com';
    if (!decodedToken.email_verified && !isGoogleUser) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 403 }
      );
    }

    // Create session cookie (expires in 7 days)
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the session cookie
    const response = NextResponse.json({ success: true });
    
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge expects seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error) {
    console.error("Session POST error:", error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (sessionCookie) {
      try {
        // Verify and revoke the session
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        await adminAuth.revokeRefreshTokens(decodedClaims.uid);
      } catch (error) {
        // Session might be invalid, but we still want to clear the cookie
        console.warn('Error revoking session:', error);
      }
    }

    // Clear the session cookie
    cookieStore.delete('session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session DELETE error:", error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}