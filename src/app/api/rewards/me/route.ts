import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getLastTransactions, getOrCreateRewardsProfile } from "@/lib/rewards";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.ok) {
      return NextResponse.json({ ok: false, reason: user.reason }, { status: 401 });
    }
    const [{ profile }, transactions] = await Promise.all([
      getOrCreateRewardsProfile(user.uid),
      getLastTransactions(user.uid, 25),
    ]);
    return NextResponse.json({ ok: true, profile, transactions });
  } catch (e: any) {
    console.error("[/api/rewards/me] error", e?.message || e);
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}