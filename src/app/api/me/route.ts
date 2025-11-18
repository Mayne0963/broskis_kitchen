export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/authServer";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let user = await getServerUser();
    let isValid = !!session && !!user;
    let expirationTime = session?.expires ? new Date(session.expires).getTime() : null;

    // Fallback: verify Authorization Bearer if cookie isn’t present
    if (!user) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      const match = authHeader && authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        try {
          const decoded = await adminAuth.verifyIdToken(match[1]);
          user = { uid: decoded.uid, email: decoded.email || null, role: (decoded as any).role || 'user' } as any;
          isValid = !!user;
          expirationTime = decoded.exp ? decoded.exp * 1000 : null;
        } catch (error) {
          isValid = false;
          return NextResponse.json({ error: "invalid_token", details: "Token verification failed" }, { status: 401 });
        }
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "unauthorized", details: "No valid session or token found" }, { status: 401 });
    }

    // Check for expired session
    if (expirationTime && expirationTime < Date.now()) {
      return NextResponse.json({ error: "session_expired", details: "Session has expired" }, { status: 401 });
    }

    const doc = await adminDb.collection("users").doc(user.uid).get();
    const profile = doc.exists ? doc.data() : {};

    return NextResponse.json({ 
      sessionValid: isValid,
      user: {
        uid: user.uid,
        email: (user as any).email ?? null,
        displayName: (profile as any)?.displayName ?? (user as any).displayName ?? null,
        role: (user as any).role ?? (profile as any)?.role ?? 'user',
        ...profile
      },
      sessionExpiration: expirationTime
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('/api/me error:', error?.message || error);
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: "token_expired", details: "Authentication token has expired" }, { status: 401 });
    }
    if (error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "invalid_token", details: "Invalid authentication token" }, { status: 400 });
    }
    return NextResponse.json({ error: 'internal_error', details: "An unexpected error occurred" }, { status: 500 });
  }
}