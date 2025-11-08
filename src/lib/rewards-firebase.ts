import { startOfDay, endOfDay } from "date-fns";
import { safeQuerySnapshot, isBuildingIndex } from "@/lib/firestoreSafe";

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
  try {
    // Lazy-load Firebase Admin to avoid import-time crashes if credentials are missing
    const admin = await import("@/lib/firebase/admin");
    const db = admin.db;

    const spinsSnap = await safeQuerySnapshot(() =>
      db
        .collection("rewardSpins")
        .where("userId", "==", uid)
        .where("createdAt", ">=", startOfDay(now))
        .where("createdAt", "<=", endOfDay(now))
        .get()
    );

    const tokensSnap = await safeQuerySnapshot(() =>
      db
        .collection("rewardEligibility")
        .where("userId", "==", uid)
        .where("consumedAt", "==", null)
        .get()
    );

    // Gracefully handle indexes still building
    if (isBuildingIndex(spinsSnap) || isBuildingIndex(tokensSnap)) {
      console.warn("Rewards indexes building; returning safe defaults for status.");
      return {
        canSpin: false,
        spinsToday: 0,
        availableTokens: 0,
      };
    }

    const spinsSize = (spinsSnap as any).size ?? 0;
    const tokensSize = (tokensSnap as any).size ?? 0;

    return {
      canSpin: spinsSize === 0 && tokensSize > 0,
      spinsToday: spinsSize,
      availableTokens: tokensSize,
    };
  } catch (err) {
    console.error("getSpinStatus error:", err);
    // Return safe defaults to avoid surface-level 500s; server logs contain details
    return {
      canSpin: false,
      spinsToday: 0,
      availableTokens: 0,
    };
  }
}

export async function consumeOneEligibilityTx(uid: string) {
  try {
    const admin = await import("@/lib/firebase/admin");
    const db = admin.db;
    return await db.runTransaction(async (tx) => {
      const q = db
        .collection("rewardEligibility")
        .where("userId", "==", uid)
        .where("consumedAt", "==", null)
        .orderBy("createdAt", "asc")
        .limit(1);
      let snap;
      try {
        snap = await tx.get(q);
      } catch (e: any) {
        // Handle indexes building gracefully
        if (e?.code === 9 || e?.code === "failed-precondition") {
          console.warn("Eligibility index building; cannot consume token now.");
          return { ok: false };
        }
        throw e;
      }
      if (snap.empty) return { ok: false };
      const doc = snap.docs[0].ref;
      tx.update(doc, { consumedAt: new Date() });
      return { ok: true };
    });
  } catch (err) {
    console.error("consumeOneEligibilityTx error:", err);
    return { ok: false };
  }
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