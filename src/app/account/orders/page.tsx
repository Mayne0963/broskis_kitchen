async function fetchOrders() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/my-orders`, { cache: "no-store" });
  if (!res.ok) return { orders: [] };
  return res.json();
}

export default async function OrdersPage() {
  const { orders } = await fetchOrders();
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Orders</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr><th className="text-left p-2">Date</th><th className="text-left p-2">Items</th><th className="text-left p-2">Total</th><th className="text-left p-2">Status</th></tr></thead>
          <tbody>
            {orders.map((o:any)=>(
              <tr key={o.id}>
                <td className="p-2">{o.date}</td>
                <td className="p-2">{o.items?.length ?? 0}</td>
                <td className="p-2">{o.totalFormatted}</td>
                <td className="p-2">{o.status}</td>
              </tr>
            ))}
            {(!orders || orders.length===0) && <tr><td className="p-2" colSpan={4}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}