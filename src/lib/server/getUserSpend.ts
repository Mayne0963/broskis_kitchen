import "server-only";
import { adminDb } from "@/lib/firebaseAdmin";

type Totals = {
  ordersCount: number;
  totalCents: number;
  totalUSD: number;
  points: number;
};

function toCentsAny(x: unknown): number {
  if (x == null) return 0;
  if (typeof x === "number") {
    // assume dollars if < 10k and not an obvious cents integer; fallback to cents if big
    return x > 10000 ? Math.round(x) : Math.round(x * 100);
  }
  if (typeof x === "string") {
    const cleaned = x.replace(/[^0-9.\-]/g, "");
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return isNaN(n) ? 0 : Math.round(n * 100);
  }
  return 0;
}

export async function getUserSpend(uid: string): Promise<Totals> {
  const snap = await adminDb.collection("orders").where("userId", "==", uid).get();

  let ordersCount = 0;
  let totalCents = 0;

  snap.forEach(doc => {
    const o: any = doc.data() || {};
    // tolerate many possible total fields
    const cents =
      (typeof o.totalCents === "number" ? Math.round(o.totalCents) : 0) ||
      toCentsAny(o.total) ||
      toCentsAny(o.amount) ||
      toCentsAny(o.grandTotal) ||
      toCentsAny(o.subtotal) ||
      0;

    totalCents += cents;
    ordersCount += 1;
  });

  const totalUSD = totalCents / 100;

  // simple rule: 1 point per $1 spent (customize later)
  const points = Math.floor(totalUSD);

  return { ordersCount, totalCents, totalUSD, points };
}