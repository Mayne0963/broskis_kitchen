export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/authServer";
import { adminDb, adminAuth } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    let user = await getServerUser();

    // Fallback: verify Authorization Bearer if cookie isn’t present
    if (!user) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      const match = authHeader && authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        const decoded = await adminAuth.verifyIdToken(match[1]);
        user = { uid: decoded.uid, email: decoded.email || null, role: (decoded as any).role || 'user' } as any;
      }
    }

    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const doc = await adminDb.collection("users").doc(user.uid).get();
    const profile = doc.exists ? doc.data() : {};
    return NextResponse.json({ 
      user: {
        uid: user.uid,
        email: (user as any).email ?? null,
        displayName: (profile as any)?.displayName ?? (user as any).displayName ?? null,
        role: (user as any).role ?? (profile as any)?.role ?? 'user',
        ...profile
      }
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('/api/me error:', error?.message || error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}