export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import { rollPrize } from "@/lib/rewards/rollPrize";
import { getUserIdOrNull } from "@/lib/auth/serverSession";
import { consumeOneEligibility } from "@/lib/rewards/eligibility";

export async function POST() {
  const userId = await getUserIdOrNull();
  if (!userId) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const now = new Date();
  try {
    const out = await db.$transaction(async (tx) => {
      const already = await tx.rewardSpin.findFirst({
        where: {
          userId,
          createdAt: {
            gte: startOfDay(now),
            lte: endOfDay(now)
          }
        },
        select: { id: true }
      });
      
      if (already) return { error: "COOLDOWN" } as const;
      
      const token = await consumeOneEligibility(tx as any, userId);
      if (!token) return { error: "NOT_ELIGIBLE" } as const;
      
      const prize = rollPrize();
      
      await tx.rewardSpin.create({
        data: {
          userId,
          resultKey: prize.key
        }
      });
      
      if (prize.points) {
        await tx.rewardPointLedger.create({
          data: {
            userId,
            delta: prize.points,
            reason: `wheel:${prize.key}`
          }
        });
      }
      
      return { ok: true, prize } as const;
    });
    
    if ("error" in out) {
      return NextResponse.json(out, { 
        status: out.error === "COOLDOWN" ? 409 : 403 
      });
    }
    
    return NextResponse.json(out);
  } catch (e) {
    console.error("spin error", e);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}