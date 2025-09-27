import { startOfDay, endOfDay } from "date-fns";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function getSpinStatus() {
  const u = await getUserId();
  const now = new Date();
  
  const spinsToday = await db.rewardSpin.count({
    where: {
      userId: u,
      createdAt: {
        gte: startOfDay(now),
        lte: endOfDay(now)
      }
    }
  });
  
  const tokens = await db.rewardEligibility.count({
    where: {
      userId: u,
      consumedAt: null
    }
  });
  
  return {
    canSpin: spinsToday === 0 && tokens > 0,
    spinsToday,
    availableTokens: tokens
  };
}

export async function consumeOneEligibility(tx: any, userId: string) {
  const token = await tx.rewardEligibility.findFirst({
    where: {
      userId,
      consumedAt: null
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  
  if (!token) return null;
  
  await tx.rewardEligibility.update({
    where: {
      id: token.id
    },
    data: {
      consumedAt: new Date()
    }
  });
  
  return token;
}