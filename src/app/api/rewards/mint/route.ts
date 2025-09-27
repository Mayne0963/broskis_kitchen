export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fdb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  const { userId, isVip, spentUsdLast24h, profileComplete } = await req.json();
  const add = [];
  if (isVip) add.push("vip:daily");
  if (spentUsdLast24h >= 20) add.push("order:$20+");
  if (profileComplete) add.push("profile:complete");
  
  const b = fdb.batch();
  add.forEach(() => 
    b.set(fdb.collection("rewardEligibility").doc(), {
      userId,
      rule: "auto",
      createdAt: new Date(),
      consumedAt: null
    })
  );
  await b.commit();
  return NextResponse.json({ ok: true, minted: add.length });
}