export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth/serverSession";
import { getSpinStatus, consumeOneEligibilityTx, rollPrize, recordSpinAndPrize } from "@/lib/rewards-firebase";

export async function POST() {
  const uid = await getUserIdOrNull();
  if (!uid) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const s = await getSpinStatus(uid);
    if (!s.canSpin) {
      return NextResponse.json(
        { error: s.availableTokens > 0 ? "COOLDOWN" : "NOT_ELIGIBLE" },
        { status: s.availableTokens > 0 ? 409 : 403 }
      );
    }

    const ok = await consumeOneEligibilityTx(uid);
    if (!ok.ok) {
      return NextResponse.json({ error: "NOT_ELIGIBLE" }, { status: 403 });
    }

    const prize = rollPrize();
    await recordSpinAndPrize(uid, prize);
    return NextResponse.json({ ok: true, prize });
  } catch (e) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}