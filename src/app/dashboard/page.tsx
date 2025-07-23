import { headers } from "next/headers";
import { getSessionCookie } from "@/lib/auth/session";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getSessionCookie();

  if (!session) {
    return <div className="text-center py-8 text-[var(--color-harvest-gold)]">Please log in to view your dashboard.</div>;
  }

  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') || '';
  
  // Get the base URL for absolute fetch calls
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const [pmRes, addrRes, phRes, ohRes] = await Promise.all([
    fetch(`${baseUrl}/api/user/payment-methods`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
    fetch(`${baseUrl}/api/user/addresses`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
    fetch(`${baseUrl}/api/user/payment-history`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
    fetch(`${baseUrl}/api/orders?userId=${session.uid}`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
  ]);
  
  // Handle API responses with proper error handling
  let paymentMethods = [];
  let addresses = [];
  let paymentHistory = [];
  let orderHistory = [];
  
  try {
    paymentMethods = pmRes.ok ? await pmRes.json() : [];
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
  }
  
  try {
    addresses = addrRes.ok ? await addrRes.json() : [];
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
  }
  
  try {
    paymentHistory = phRes.ok ? await phRes.json() : [];
  } catch (error) {
    console.error('Failed to fetch payment history:', error);
  }
  
  try {
    const orderData = ohRes.ok ? await ohRes.json() : { orders: [] };
    const orders = orderData.orders || [];
    orderHistory = orders.map(order => ({
      id: order.id,
      date: order.createdAt,
      items: order.items?.map(item => item.name).join(', ') || 'No items',
      total: order.total
    }));
  } catch (error) {
    console.error('Failed to fetch order history:', error);
  }

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