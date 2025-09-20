export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import KpiCard from "@/components/kpi/KpiCard";
import { adminDb } from "@/lib/firebaseAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function toDateStr(d: Date) {
  return d.toISOString().slice(0,10);
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // --- Metrics (server-direct) ---
  // Revenue + orders last 30d
  const orders30Snap = await adminDb
    .collection("orders")
    .where("createdAt", ">=", d30)
    .get();

  let revenue30 = 0;
  const activeUserSet = new Set<string>();
  const recentForTable: { id: string; date: string; total: string; status: string }[] = [];

  orders30Snap.forEach(doc => {
    const o: any = doc.data();
    const cents = Number(o.totalCents || 0);
    revenue30 += cents;
    if (o.userId) activeUserSet.add(String(o.userId));
    // collect a few recents for table
    recentForTable.push({
      id: doc.id,
      date: toDateStr(o.createdAt?.toDate?.() || new Date()),
      total: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100),
      status: o.status || "paid",
    });
  });

  // sort recents by date desc & trim to 10 rows
  recentForTable.sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = recentForTable.slice(0, 10);

  // Total orders (lifetime) — lightweight count
  const totalOrdersSnap = await adminDb.collection("orders").limit(1).get();
  // If counting exactly is heavy, show orders30Snap.size with subtitle "last 30 days".
  // Here we'll show 30d orders count as primary.
  const orders30Count = orders30Snap.size;

  const revenue30USD = revenue30 / 100;
  const activeUsers30 = activeUserSet.size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Orders (30d)" value={orders30Count} format="number" subtitle="Last 30 days" />
        <KpiCard title="Revenue (30d)" value={revenue30USD} format="currency" currency="USD" subtitle="Last 30 days" />
        <KpiCard title="Active Users (30d)" value={activeUsers30} format="number" subtitle="Placed an order in 30d" />
      </div>

      <Card className="rounded-2xl border-[#FFD700] bg-[#0b0b0b] text-white">
        <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.12)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-white/70">Order</TableHead>
                  <TableHead className="text-white/70">Date</TableHead>
                  <TableHead className="text-white/70">Total</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map(r => (
                  <TableRow key={r.id} className="hover:bg-white/5">
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.total}</TableCell>
                    <TableCell className="capitalize">{r.status}</TableCell>
                  </TableRow>
                ))}
                {recent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-white/60">No orders in the last 30 days.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}