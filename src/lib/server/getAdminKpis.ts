import "server-only";
import { adminDb } from "@/lib/firebaseAdmin";

function fmtUSD(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export async function getAdminKpis() {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const q = await adminDb.collection("orders").where("createdAt", ">=", d30).get();

  let revenueCents = 0;
  const activeUsers = new Set<string>();
  const recent: { id: string; date: string; total: string; status: string }[] = [];

  q.forEach(doc => {
    const o: any = doc.data() || {};
    const cents =
      (typeof o.totalCents === "number" ? Math.round(o.totalCents) : 0) ||
      Math.round(Number(String(o.total || "0").replace(/[^0-9.\-]/g, "")) * 100) ||
      0;

    revenueCents += cents;
    if (o.userId) activeUsers.add(String(o.userId));

    const d =
      typeof o.createdAt?.toDate === "function"
        ? o.createdAt.toDate()
        : (o.createdAt instanceof Date ? o.createdAt : new Date());

    recent.push({
      id: doc.id,
      date: d.toISOString().slice(0, 10),
      total: fmtUSD(cents / 100),
      status: o.status || "paid",
    });
  });

  recent.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    revenue30USD: revenueCents / 100,
    orders30Count: q.size,
    activeUsers30: activeUsers.size,
    recent: recent.slice(0, 10),
  };
}