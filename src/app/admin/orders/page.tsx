"use client";
import { useEffect, useMemo, useState } from "react";
import OrdersFilters from "@/components/admin/OrdersFilters";
import OrdersTable from "@/components/admin/OrdersTable";
import AdminGate from "@/components/admin/AdminGate";

type AdminOrder = Parameters<typeof OrdersTable>[0] extends { orders: infer T } ? T : never;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [density, setDensity] = useState<"compact" | "comfy">("compact");

  async function load(reset = false) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (!reset && cursor) params.set("page", "2");
    const res = await fetch(`/api/admin/orders?${params.toString()}`, { cache: "no-store" });
    const j = await res.json();
    setOrders(reset ? (j.orders || []) : [...orders, ...(j.orders || [])]);
    setCursor(null);
    setLoading(false);
  }

  useEffect(() => { load(true); }, [q, status, from, to]);

  const filtered = useMemo(() => orders, [orders]);

  return (
    <AdminGate>
      <div className="mx-auto max-w-6xl px-6 py-10 text-slate-100">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold text-yellow-300">Orders Admin</h1>
        </div>
        <OrdersFilters onChange={({ q, status, from, to, density }) => { setQ(q); setStatus(status); setFrom(from); setTo(to); setDensity(density); }} />
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
          <OrdersTable orders={filtered as any} />
        </div>
      </div>
    </AdminGate>
  );
}