export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth/session";
import { getSpinStatus } from "@/lib/rewards-firebase";
import { handleServerError } from "@/lib/utils/errorLogger";

export async function GET() {
  // Prefer cookie-based auth to avoid NextAuth-only dependency
  const sessionUser = await getSessionCookie();
  const uid = sessionUser?.uid;

  if (!uid) {
    // Log unauthenticated access for server diagnostics
    handleServerError(new Error("Unauthenticated request"), "Rewards Status API - Missing UID");
    // Standardize shape expected by client
    return NextResponse.json(
      { success: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  try {
    const status = await getSpinStatus(uid);
    // Return shape that RewardsContext expects
    return NextResponse.json({ success: true, status });
  } catch (e) {
    // Structured server error logging for better debugging
    handleServerError(e as Error, "Rewards Status API - getSpinStatus failure");
    return NextResponse.json({ success: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}