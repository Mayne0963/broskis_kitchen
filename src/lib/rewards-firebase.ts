import { db } from "@/lib/firebase/admin";
import { startOfDay, endOfDay } from "date-fns";

export const PRIZES = [
  { key: "50_pts", label: "50 pts", weight: 28, points: 50 },
  { key: "100_pts", label: "100 pts", weight: 18, points: 100 },
  { key: "5_off", label: "$5 OFF", weight: 10 },
  { key: "free_dessert", label: "Free Dessert", weight: 4 },
  { key: "try_again", label: "Try Again", weight: 40 }
];

export function rollPrize() {
  const T = PRIZES.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * T;
  for (const p of PRIZES) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return PRIZES[PRIZES.length - 1];
}

export async function getSpinStatus(uid: string) {
  const now = new Date();
  const spins = await db
    .collection("rewardSpins")
    .where("userId", "==", uid)
    .where("createdAt", ">=", startOfDay(now))
    .where("createdAt", "<=", endOfDay(now))
    .get();
  const tokens = await db
    .collection("rewardEligibility")
    .where("userId", "==", uid)
    .where("consumedAt", "==", null)
    .get();
  return {
    canSpin: spins.size === 0 && tokens.size > 0,
    spinsToday: spins.size,
    availableTokens: tokens.size
  };
}

export async function consumeOneEligibilityTx(uid: string) {
  return await db.runTransaction(async (tx) => {
    const q = db
      .collection("rewardEligibility")
      .where("userId", "==", uid)
      .where("consumedAt", "==", null)
      .orderBy("createdAt", "asc")
      .limit(1);
    const snap = await tx.get(q);
    if (snap.empty) return { ok: false };
    const doc = snap.docs[0].ref;
    tx.update(doc, { consumedAt: new Date() });
    return { ok: true };
  });
}

export async function recordSpinAndPrize(uid: string, prize: any) {
  const b = db.batch();
  b.set(db.collection("rewardSpins").doc(), {
    userId: uid,
    resultKey: prize.key,
    createdAt: new Date()
  });
  if (prize.points) {
    b.set(db.collection("rewardPointLedger").doc(), {
      userId: uid,
      delta: prize.points,
      reason: `wheel:${prize.key}`,
      createdAt: new Date()
    });
  }
  await b.commit();
}