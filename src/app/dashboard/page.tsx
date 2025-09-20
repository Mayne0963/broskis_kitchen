export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { adminDb } from "@/lib/firebaseAdmin";
import { getServerUser } from "@/lib/authServer";
import { LuxeCard, LuxeCardContent, LuxeCardHeader, LuxeCardTitle } from "@/components/luxe/LuxeCard";
import KpiCard from "@/components/kpi/KpiCard";
import QuickActions from "@/components/dashboard/QuickActions";

function currency(v: number, code: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(v);
}

export default async function DashboardPage() {
  const user = await getServerUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LuxeCard>
            <LuxeCardHeader><LuxeCardTitle>Welcome</LuxeCardTitle></LuxeCardHeader>
            <LuxeCardContent>Please sign in to view your dashboard.</LuxeCardContent>
          </LuxeCard>
        </div>
      </div>
    );
  }

  // --- Server-direct queries ---
  const snap = await adminDb
    .collection("orders")
    .where("userId", "==", user.uid)
    .get();

  let myOrdersCount = 0;
  let myCents = 0;

  snap.forEach(doc => {
    const o = doc.data() as any;
    myOrdersCount += 1;
    myCents += Number(o.totalCents || 0);
  });

  const mySpendUSD = myCents / 100;

  // simple placeholder rule: 1 point per $1 spent.
  const myPoints = Math.floor(mySpendUSD);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Welcome back, {user.email?.split("@")[0] ?? "Guest"}!</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard title="My Orders" value={myOrdersCount} format="number" subtitle="Lifetime" />
          <KpiCard title="My Spending" value={mySpendUSD} format="currency" currency="USD" subtitle="Lifetime total" />
          <KpiCard title="Loyalty Points" value={myPoints} format="number" subtitle="1 pt per $1" />
        </div>

        <QuickActions />
      </div>
    </div>
  );
}