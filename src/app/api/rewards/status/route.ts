export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth/serverSession";
import { getSpinStatus } from "@/lib/rewards-firebase";

export async function GET() {
  const uid = await getUserIdOrNull();
  if (!uid) {
    return NextResponse.json({
      canSpin: false,
      spinsToday: 0,
      availableTokens: 0,
      unauthenticated: true,
    });
  }

  try {
    return NextResponse.json(await getSpinStatus(uid));
  } catch (e) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}