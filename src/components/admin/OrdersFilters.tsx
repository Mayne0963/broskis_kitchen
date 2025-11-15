"use client";
import { useEffect, useState } from "react";

export default function OrdersFilters({ onChange }: { onChange: (v: { q: string; status: string; from?: string; to?: string; density: "compact" | "comfy" }) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [density, setDensity] = useState<"compact" | "comfy">("compact");

  useEffect(() => { onChange({ q, status, from, to, density }); }, [q, status, from, to, density, onChange]);

  return (
    <div className="mt-6 grid sm:grid-cols-6 gap-3">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="sm:col-span-3 rounded bg-slate-900 border border-slate-700 p-2 text-white" />
      <select value={status} onChange={e => setStatus(e.target.value)} className="rounded bg-slate-900 border border-slate-700 p-2 text-white">
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="preparing">Preparing</option>
        <option value="ready">Ready</option>
        <option value="out_for_delivery">Out For Delivery</option>
        <option value="delivered">Delivered</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <input type="date" value={from || ""} onChange={e => setFrom(e.target.value || undefined)} className="rounded bg-slate-900 border border-slate-700 p-2 text-white" />
      <input type="date" value={to || ""} onChange={e => setTo(e.target.value || undefined)} className="rounded bg-slate-900 border border-slate-700 p-2 text-white" />
      <select value={density} onChange={e => setDensity(e.target.value as any)} className="rounded bg-slate-900 border border-slate-700 p-2 text-white">
        <option value="compact">Compact</option>
        <option value="comfy">Comfy</option>
      </select>
    </div>
  );
}