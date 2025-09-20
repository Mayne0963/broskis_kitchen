import "server-only";
import { adminDb } from "@/lib/firebaseAdmin";

function toCentsAny(x: unknown): number {
  if (x == null) return 0;
  if (typeof x === "number") return x > 10000 ? Math.round(x) : Math.round(x * 100);
  if (typeof x === "string") {
    const n = Number(x.replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : Math.round(n * 100);
  }
  return 0;
}

export async function getUserTotals(uid: string) {
  const snap = await adminDb.collection("orders").where("userId", "==", uid).get();

  let ordersCount = 0;
  let totalCents = 0;

  snap.forEach(doc => {
    const o: any = doc.data() || {};
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
  const points = Math.floor(totalUSD); // 1 point per $1 for now

  return { ordersCount, totalUSD, points };
}