"use client";
import { useEffect, useState } from "react";

export default function CateringAdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/catering", { cache: "no-store" });
        if (!res.ok) {
          setError(`Failed to load catering data (${res.status})`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setOrders(data);
      } catch (e: any) {
        setError("Network error loading catering data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-[var(--color-harvest-gold)]">Catering Orders</h1>

      {loading && (
        <p className="text-slate-300">Loading catering data…</p>
      )}

      {error && (
        <div className="border border-red-700 bg-red-900/30 text-red-200 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        orders.length === 0 ? (
          <p className="text-slate-400">No catering orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-lg p-4 border border-[var(--color-harvest-gold)]/30 bg-[var(--color-rich-black)]/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">{o.clientName ?? o.customer?.name ?? "Unknown"}</p>
                    <p className="text-sm text-slate-400">{o.date ?? o.event?.date ?? "—"}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-[var(--color-harvest-gold)]/20 text-[var(--color-harvest-gold)] border border-[var(--color-harvest-gold)]/30">
                    {o.status ?? "new"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}