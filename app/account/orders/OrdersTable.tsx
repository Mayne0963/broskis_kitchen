"use client";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u, { credentials: "include" }).then(r => r.json());

export default function OrdersTable({ userId }: { userId: string }) {
  const { data, error, isLoading } = useSWR(`/api/orders?mine=1`, fetcher);
  
  if (isLoading) return <div>Loading orders…</div>;
  if (error) return <div>Could not load orders.</div>;
  
  const orders = data?.orders ?? [];
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2 border-b">Date</th>
            <th className="text-left p-2 border-b">Items</th>
            <th className="text-left p-2 border-b">Total</th>
            <th className="text-left p-2 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o: any) => (
            <tr key={o.id} className="border-b">
              <td className="p-2">{o.date}</td>
              <td className="p-2">{o.items?.length ?? 0}</td>
              <td className="p-2">{o.totalFormatted}</td>
              <td className="p-2">{o.status}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}