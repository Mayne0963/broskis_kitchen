"use client";
import { useEffect, useState } from "react";

export default function CateringAdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/catering", { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to load catering data");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-slate-200">Loading catering data…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold mb-2">Catering Orders</h1>
      {orders.length === 0 ? (
        <p className="text-slate-400">No catering orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="rounded bg-slate-900 p-4 border border-slate-800">
            <p className="font-medium">{order.clientName}</p>
            <p className="text-sm text-slate-300">{order.date}</p>
          </div>
        ))
      )}
    </div>
  );
}