export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getServerUser } from "@/lib/session";
import { adminDb } from "@/lib/firebaseAdmin";
import { orderTotalCents } from "@/lib/server/orderTotals";
import { LuxeCard, LuxeCardHeader, LuxeCardTitle, LuxeCardContent } from "@/components/luxe/LuxeCard";
import { LuxeTableWrap, LuxeTable, LuxeTableBody, LuxeTableCell, LuxeTableHead, LuxeTableHeader, LuxeTableRow } from "@/components/luxe/LuxeTable";
import { redirect } from 'next/navigation';

function usd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default async function OrdersPage() {
  const user = await getServerUser();
  if (!user) {
    redirect('/login?next=/account/orders');
  }

  const snap = await adminDb.collection("orders").where("userId", "==", user.uid).get();

  const rows: { id: string; date: string; totalUSD: number; items: number; status: string }[] = [];
  let lifetimeCents = 0;

  snap.forEach(doc => {
    const o: any = doc.data();
    const cents = orderTotalCents(o);
    lifetimeCents += cents;
    const items = Array.isArray(o.items) ? o.items.length : Number(o.itemsCount ?? 0);
    const d = o.createdAt?.toDate?.() instanceof Date ? o.createdAt.toDate() : new Date();
    rows.push({
      id: doc.id,
      date: d.toISOString().slice(0, 10),
      totalUSD: cents / 100,
      items,
      status: o.status ?? "delivered",
    });
  });

  rows.sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-white space-y-4">
      <LuxeCard>
        <LuxeCardHeader><LuxeCardTitle>My Orders</LuxeCardTitle></LuxeCardHeader>
        <LuxeCardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.12)] bg-black px-4 py-3">
            <div className="text-white/70">Lifetime Spend</div>
            <div className="text-xl font-semibold text-[#FFD700]">{usd(lifetimeCents / 100)}</div>
          </div>

          <LuxeTableWrap>
            <LuxeTable>
              <LuxeTableHeader>
                <LuxeTableRow className="hover:bg-transparent">
                  <LuxeTableHead className="text-white/70">Date</LuxeTableHead>
                  <LuxeTableHead className="text-white/70">Items</LuxeTableHead>
                  <LuxeTableHead className="text-white/70">Total</LuxeTableHead>
                  <LuxeTableHead className="text-white/70">Status</LuxeTableHead>
                </LuxeTableRow>
              </LuxeTableHeader>
              <LuxeTableBody>
                {rows.map(r => (
                  <LuxeTableRow key={r.id} className="hover:bg-white/5">
                    <LuxeTableCell>{r.date}</LuxeTableCell>
                    <LuxeTableCell>{r.items || 1}</LuxeTableCell>
                    <LuxeTableCell>{usd(r.totalUSD)}</LuxeTableCell>
                    <LuxeTableCell className="capitalize">{r.status}</LuxeTableCell>
                  </LuxeTableRow>
                ))}
                {rows.length === 0 && (
                  <LuxeTableRow>
                    <LuxeTableCell colSpan={4} className="text-white/60">No orders yet.</LuxeTableCell>
                  </LuxeTableRow>
                )}
              </LuxeTableBody>
            </LuxeTable>
          </LuxeTableWrap>
        </LuxeCardContent>
      </LuxeCard>
    </div>
  );
}