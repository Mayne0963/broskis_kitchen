export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getServerUser } from "@/lib/authServer";
import { getUserTotals } from "@/lib/server/orderTotals";
import KpiCard from "@/components/kpi/KpiCard";
import QuickActions from "@/components/QuickActions";
import { LuxeCard, LuxeCardHeader, LuxeCardTitle, LuxeCardContent } from "@/components/luxe/LuxeCard";

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

  const totals = await getUserTotals(user.uid);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Welcome back, {user.email?.split("@")[0] ?? "Friend"}!</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard title="My Orders" value={totals.ordersCount} format="number" subtitle="Lifetime" />
          <KpiCard title="My Spending" value={totals.totalUSD} format="currency" currency="USD" subtitle="Lifetime total" />
          <KpiCard title="Loyalty Points" value={totals.points} format="number" subtitle="1 pt per $1" />
        </div>

        <QuickActions />
      </div>
    </div>
  );
}