export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getServerUser } from "@/lib/authServer";
import { getUserTotals } from "@/lib/server/getUserTotals";
import { adminDb } from "@/lib/firebaseAdmin";
import { LuxeCard, LuxeCardHeader, LuxeCardTitle, LuxeCardContent } from "@/components/luxe/LuxeCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default async function OrdersPage() {
  const user = await getServerUser();
  if (!user) {
    return (
      <LuxeCard>
        <LuxeCardHeader><LuxeCardTitle>My Orders</LuxeCardTitle></LuxeCardHeader>
        <LuxeCardContent>Please sign in to see your orders.</LuxeCardContent>
      </LuxeCard>
    );
  }

  const totals = await getUserTotals(user.uid);
  const snap = await adminDb.collection("orders").where("userId", "==", user.uid).orderBy("createdAt", "desc").get();

  const orders = snap.docs.map(d => {
    const o: any = d.data() || {};
    const cents =
      (typeof o.totalCents === "number" ? Math.round(o.totalCents) : 0) ||
      Math.round(Number(String(o.total || "0").replace(/[^0-9.\-]/g, "")) * 100) ||
      0;
    const date =
      typeof o.createdAt?.toDate === "function"
        ? o.createdAt.toDate()
        : (o.createdAt instanceof Date ? o.createdAt : new Date());
    return {
      id: d.id,
      date: date.toISOString().slice(0, 10),
      items: o.items?.length ?? o.itemsCount ?? "—",
      total: fmtUSD(cents / 100),
      status: o.status || "paid",
    };
  });

  return (
    <LuxeCard>
      <LuxeCardHeader><LuxeCardTitle>My Orders</LuxeCardTitle></LuxeCardHeader>
      <LuxeCardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.12)] bg-black px-4 py-3">
          <div className="text-white/70">Lifetime Spend</div>
          <div className="text-xl font-semibold text-[#FFD700]">{fmtUSD(totals.totalUSD)}</div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.12)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-white/70">Date</TableHead>
                <TableHead className="text-white/70">Items</TableHead>
                <TableHead className="text-white/70">Total</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-white/60">No orders yet.</TableCell></TableRow>
              ) : (
                orders.map(o => (
                  <TableRow key={o.id} className="hover:bg-white/5">
                    <TableCell>{o.date}</TableCell>
                    <TableCell>{o.items}</TableCell>
                    <TableCell>{o.total}</TableCell>
                    <TableCell className="capitalize">{o.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </LuxeCardContent>
    </LuxeCard>
  );
}