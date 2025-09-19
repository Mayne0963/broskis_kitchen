export const dynamic = "force-dynamic";
import KpiCard from "@/components/kpi/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminDashboardPage() {
  // Placeholder values; backend can hydrate later.
  const kpis = [
    { label: "Total Orders", value: "1,204" },
    { label: "Revenue (30d)", value: "$42,910" },
    { label: "Active Users", value: "356" },
  ];

  const recent = [
    { id: "ORD-1001", date: "2025-09-18", total: "$62.40", status: "paid" },
    { id: "ORD-1000", date: "2025-09-18", total: "$24.10", status: "paid" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map(k => <KpiCard key={k.label} label={k.label} value={k.value} />)}
      </div>

      <Card className="bk-card">
        <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)]">
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
                  <TableRow><TableCell colSpan={4} className="text-white/60">No data yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}