export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth/serverSession";
import { getSpinStatus } from "@/lib/rewards-firebase";

export async function GET() {
  const uid = await getUserIdOrNull();
  if (!uid) {
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
    return NextResponse.json({ success: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}