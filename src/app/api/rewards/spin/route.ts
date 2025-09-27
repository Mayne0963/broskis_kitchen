import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import { rollPrize } from "@/lib/rewards/rollPrize";
import { getUserId } from "@/lib/auth";
import { consumeOneEligibility } from "@/lib/rewards/eligibility";

export async function POST() {
  try {
    const u = await getUserId();
    if (!u) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    
    const now = new Date();
    
    const res = await db.$transaction(async (tx) => {
      // Check if user already spun today
      const already = await tx.rewardSpin.findFirst({
        where: {
          userId: u,
          createdAt: {
            gte: startOfDay(now),
            lte: endOfDay(now)
          }
        }
      });
      
      if (already) {
        return { error: "COOLDOWN" };
      }
      
      // Consume one eligibility token
      const token = await consumeOneEligibility(tx, u);
      if (!token) {
        return { error: "NOT_ELIGIBLE" };
      }
      
      // Roll for prize
      const prize = rollPrize();
      
      // Record the spin
      await tx.rewardSpin.create({
        data: {
          userId: u,
          resultKey: prize.key
        }
      });
      
      // Add points to ledger if prize has points
      if (prize.points) {
        await tx.rewardPointLedger.create({
          data: {
            userId: u,
            delta: prize.points,
            reason: `wheel:${prize.key}`
          }
        });
      }
      
      return { ok: true, prize };
    });
    
    if ("error" in res) {
      const status = res.error === "COOLDOWN" ? 409 : 403;
      return NextResponse.json(res, { status });
    }
    
    return NextResponse.json(res);
  } catch (e) {
    console.error('Error in spin endpoint:', e);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}