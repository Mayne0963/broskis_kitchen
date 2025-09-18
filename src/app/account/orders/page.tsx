// app/account/orders/page.tsx
export const dynamic = "force-dynamic";
import { API_BASE } from "@/lib/apiBase";

async function getOrders() {
  try {
    const res = await fetch(`${API_BASE}/api/my-orders`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) return { orders: [] };
    return await res.json();
  } catch {
    return { orders: [] };
  }
}

export default async function OrdersPage() {
  const { orders } = await getOrders();
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Orders</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Items</th>
              <th className="text-left p-2">Total</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o:any) => (
              <tr key={o.id} className="border-b border-gray-200">
                <td className="p-2">{o.date}</td>
                <td className="p-2">{o.items?.length ?? 0}</td>
                <td className="p-2">{o.totalFormatted ?? "$0.00"}</td>
                <td className="p-2">{o.status ?? "processing"}</td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td className="p-2" colSpan={4}>No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}