export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const COOKIE_NAME = "session"; // standard on Vercel/Edge-friendly name

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "missing token" }, { status: 400 });

    // Verify the ID token first
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    // 14 days max; pick your horizon
    const expiresIn = 14 * 24 * 60 * 60 * 1000;

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${sessionCookie}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${expiresIn / 1000}`
    );
    return res;
  } catch (e) {
    console.error('Session creation error:', e);
    return NextResponse.json({ error: "unable to create session" }, { status: 401 });
  }
}

export async function DELETE(req: Request) {
  try {
    // No authentication required for logout - just clear the cookie
    const res = NextResponse.json({ ok: true });
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
    );
    return res;
  } catch (e) {
    console.error('Session deletion error:', e);
    return NextResponse.json({ error: "unable to delete session" }, { status: 500 });
  }
}