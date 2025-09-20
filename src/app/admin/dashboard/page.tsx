export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getAdminKpis } from "@/lib/server/getAdminKpis";
import KpiCard from "@/components/kpi/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminDashboardPage() {
  const k = await getAdminKpis();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Orders (30d)" value={k.orders30Count} format="number" subtitle="Last 30 days" />
        <KpiCard title="Revenue (30d)" value={k.revenue30USD} format="currency" currency="USD" subtitle="Last 30 days" />
        <KpiCard title="Active Users (30d)" value={k.activeUsers30} format="number" subtitle="Placed an order" />
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
                {k.recent.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-white/60">No orders in last 30 days.</TableCell></TableRow>
                ) : (
                  k.recent.map(r => (
                    <TableRow key={r.id} className="hover:bg-white/5">
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{r.total}</TableCell>
                      <TableCell className="capitalize">{r.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}