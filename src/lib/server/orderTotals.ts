import "server-only";
import { adminDb, Timestamp } from "@/lib/firebaseAdmin";

function toCentsAny(x: unknown): number {
  if (x == null) return 0;
  if (typeof x === "number") {
    // Heuristic: treat values > 10k as cents, small values as dollars
    return x > 10000 ? Math.round(x) : Math.round(x * 100);
  }
  if (typeof x === "string") {
    const cleaned = x.replace(/[^0-9.\-]/g, "");
    const n = Number(cleaned);
    return isNaN(n) ? 0 : Math.round(n * 100);
  }
  return 0;
}

export function orderTotalCents(o: any): number {
  // Try common top-level fields
  const top =
    (typeof o.totalCents === "number" ? Math.round(o.totalCents) : 0) ||
    toCentsAny(o.total) ||
    toCentsAny(o.amount) ||
    toCentsAny(o.grandTotal) ||
    toCentsAny(o.subtotal);

  if (top) return top;

  // Fallback: sum line items
  const items: any[] = Array.isArray(o.items) ? o.items : [];
  let sum = 0;
  for (const it of items) {
    const qty = Number(it.quantity ?? 1);
    const cents =
      (typeof it.priceCents === "number" ? Math.round(it.priceCents) : 0) ||
      toCentsAny(it.price) ||
      toCentsAny(it.amount);
    sum += Math.max(0, cents) * Math.max(1, qty);
  }
  return sum;
}

export async function getUserTotals(uid: string) {
  const snap = await adminDb.collection("orders").where("userId", "==", uid).get();

  let ordersCount = 0;
  let totalCents = 0;

  snap.forEach(doc => {
    const o = doc.data();
    ordersCount += 1;
    totalCents += orderTotalCents(o);
  });

  const totalUSD = totalCents / 100;
  const points = Math.floor(totalUSD); // 1 pt per $1

  return { ordersCount, totalCents, totalUSD, points };
}

export async function getAdminKpis30d() {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const q = await adminDb.collection("orders").where("createdAt", ">=", Timestamp.fromDate(start)).get();

  let orders30 = 0;
  let revenueCents30 = 0;
  const activeUsers = new Set<string>();
  const recent: { id: string; date: string; total: string; status: string }[] = [];

  q.forEach(doc => {
    const o: any = doc.data();
    orders30 += 1;
    const cents = orderTotalCents(o);
    revenueCents30 += cents;
    if (o.userId) activeUsers.add(String(o.userId));
    const d = o.createdAt?.toDate?.() instanceof Date ? o.createdAt.toDate() : new Date();
    recent.push({
      id: doc.id,
      date: d.toISOString().slice(0, 10),
      total: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100),
      status: o.status ?? "paid",
    });
  });

  recent.sort((a, b) => (a.date < b.date ? 1 : -1));
  return {
    orders30,
    revenue30USD: revenueCents30 / 100,
    activeUsers30: activeUsers.size,
    recent: recent.slice(0, 10),
  };
}