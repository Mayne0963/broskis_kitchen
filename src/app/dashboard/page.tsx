import { headers } from "next/headers";
import { getSessionCookie } from "@/lib/auth/session";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getSessionCookie();

  if (!session) {
    return <div className="text-center py-8 text-[var(--color-harvest-gold)]">Please log in to view your dashboard.</div>;
  }

  const headersList = headers();
  const cookieHeader = headersList.get('cookie') || '';

  const [pmRes, addrRes, phRes, ohRes] = await Promise.all([
    fetch('/api/user/payment-methods', { cache: 'no-store', headers: { cookie: cookieHeader } }),
    fetch('/api/user/addresses', { cache: 'no-store', headers: { cookie: cookieHeader } }),
    fetch('/api/user/payment-history', { cache: 'no-store', headers: { cookie: cookieHeader } }),
    fetch(`/api/orders?userId=${session.uid}`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
  ]);
 
  const paymentMethods = pmRes.ok ? await pmRes.json() : [];
  const addresses = addrRes.ok ? await addrRes.json() : [];
  const paymentHistory = phRes.ok ? await phRes.json() : [];
  const { orders } = ohRes.ok ? await ohRes.json() : { orders: [] };
  const orderHistory = orders.map(order => ({
    id: order.id,
    date: order.createdAt,
    items: order.items.map(item => item.name).join(', '),
    total: order.total
  }));

  return (
    <DashboardClient
      initialPaymentMethods={paymentMethods}
      initialAddresses={addresses}
      initialPaymentHistory={paymentHistory}
      initialOrderHistory={orderHistory}
      userId={session.uid}
    />
  );
}