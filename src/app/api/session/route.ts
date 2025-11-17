export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/authServer";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    let user = await getServerUser();
    if (!user) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      const match = authHeader && authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        const decoded = await adminAuth.verifyIdToken(match[1]);
        user = { uid: decoded.uid, email: decoded.email || null, role: (decoded as any).role || 'user' } as any;
      }
    }
    if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, user }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('/api/session error:', error?.message || error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}