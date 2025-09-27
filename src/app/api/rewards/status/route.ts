export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import { getUserIdOrNull } from "@/lib/auth/serverSession";

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) {
    return NextResponse.json(
      { canSpin: false, spinsToday: 0, availableTokens: 0, unauthenticated: true },
      { status: 200 }
    );
  }

  const now = new Date();
  try {
    const spinsToday = await db.rewardSpin.count({
      where: {
        userId,
        createdAt: {
          gte: startOfDay(now),
          lte: endOfDay(now)
        }
      }
    });

    const tokens = await db.rewardEligibility.count({
      where: {
        userId,
        consumedAt: null
      }
    });

    return NextResponse.json({
      canSpin: spinsToday === 0 && tokens > 0,
      spinsToday,
      availableTokens: tokens
    });
  } catch (e) {
    console.error("status error", e);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}