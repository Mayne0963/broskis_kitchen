export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { adminAuth, ensureAdmin } from "@/lib/firebaseAdmin";

const COOKIE_NAME = "__session"; // standard on Vercel/Edge-friendly name

export async function POST(req: Request) {
  try {
    await ensureAdmin(req);
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "missing token" }, { status: 400 });

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
    return NextResponse.json({ error: "unable to create session" }, { status: 401 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureAdmin(req);
    // Clear cookie
    const res = NextResponse.json({ ok: true });
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
    );
    return res;
  } catch (e) {
    return NextResponse.json({ error: "unable to delete session" }, { status: 401 });
  }
}