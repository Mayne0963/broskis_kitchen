"use client";

import { useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

type Item = any;

export default function AdminCateringPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<Item | null>(null);

  async function load() {
    setLoading(true);
    const u = new URL("/api/admin/catering/list", window.location.origin);
    if (q) u.searchParams.set("q", q);
    if (st) u.searchParams.set("status", st);
    const r = await fetch(u.toString()).then((r) => r.json());
    setItems(r.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st]);

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/catering/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  const Badge = ({ v }: { v: string }) => (
    <span
      className={`px-2 py-1 rounded text-xs capitalize ${
        v === "confirmed"
          ? "bg-emerald-600/30 text-emerald-200"
          : v === "quoted"
          ? "bg-blue-600/30 text-blue-200"
          : v === "canceled"
          ? "bg-rose-600/30 text-rose-200"
          : "bg-slate-700/40 text-slate-200"
      }`}
    >
      {v}
    </span>
  );

  return (
    <AdminGate>
      <div className="mx-auto max-w-6xl px-6 py-10 text-slate-100">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold text-yellow-300">Catering Admin</h1>
          <a
            href="/api/admin/catering/export"
            className="px-3 py-2 rounded bg-slate-800 border border-slate-600 hover:border-yellow-500"
          >
            Export CSV
          </a>
        </div>

        <div className="mt-6 grid sm:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search…"
            className="sm:col-span-3 rounded bg-slate-900 border border-slate-700 p-2"
          />
          <select
            value={st}
            onChange={(e) => setSt(e.target.value)}
            className="rounded bg-slate-900 border border-slate-700 p-2"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="quoted">Quoted</option>
            <option value="confirmed">Confirmed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-300">
              <tr>
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left px-2">Name</th>
                <th className="text-left px-2">Email</th>
                <th className="text-left px-2">Pkg</th>
                <th className="text-left px-2">Guests</th>
                <th className="text-left px-2">Deposit</th>
                <th className="text-left px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    Loading…
                  </td>
                </tr>
              ) : (
                items.map((it: any) => (
                  <tr
                    key={it.id}
                    onClick={() => setFocus(it)}
                    className="border-b border-slate-800 hover:bg-slate-900/40 cursor-pointer"
                  >
                    <td className="py-2 px-2">
                      {(it.createdAt || "").slice(0, 10)}
                    </td>
                    <td className="px-2">{it.customer?.name}</td>
                    <td className="px-2">{it.customer?.email}</td>
                    <td className="px-2 capitalize">{it.packageId}</td>
                    <td className="px-2">{it.guests}</td>
                    <td className="px-2 text-yellow-300">
                      ${it.price?.deposit}
                    </td>
                    <td className="px-2">
                      <Badge v={it.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {focus && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setFocus(null)}
          >
            <div
              className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-[#0B0F15] border-l border-slate-800 p-5 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold text-yellow-300">
                  Req #{focus.id?.slice(-6)}
                </h2>
                <button
                  onClick={() => setFocus(null)}
                  className="text-slate-400"
                >
                  Close
                </button>
              </div>

              <div className="mt-3 text-sm text-slate-300 space-y-1">
                <div>
                  Customer: {focus.customer?.name} · {focus.customer?.email}
                </div>
                <div>
                  Event: {focus.event?.date} at {focus.event?.time}
                </div>
                <div>Package: {focus.packageId} · {focus.guests} guests</div>
                <div>Status: <Badge v={focus.status} /></div>
              </div>

              {focus.menu && (
                <div className="mt-4">
                  <h3 className="font-medium text-yellow-300">Menu Selections</h3>
                  <div className="mt-2 text-sm text-slate-300 space-y-1">
                    {Object.entries(focus.menu).map(([category, items]: [string, any]) => (
                      <div key={category}>
                        <span className="capitalize font-medium">{category}:</span> {Array.isArray(items) ? items.join(", ") : items}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h3 className="font-medium text-yellow-300">Pricing</h3>
                <div className="mt-2 text-sm text-slate-300 space-y-1">
                  <div>Subtotal: ${focus.price?.subtotal}</div>
                  <div>Tax: ${focus.price?.tax}</div>
                  <div>Total: ${focus.price?.total}</div>
                  <div>Deposit: ${focus.price?.deposit}</div>
                </div>
              </div>

              {focus.stripeCheckoutUrl && (
                <div className="mt-4">
                  <a
                    href={focus.stripeCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Stripe Checkout
                  </a>
                </div>
              )}

              <div className="mt-6 space-y-2">
                <h3 className="font-medium text-yellow-300">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatus(focus.id, "quoted")}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Quote
                  </button>
                  <button
                    onClick={() => setStatus(focus.id, "confirmed")}
                    className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setStatus(focus.id, "canceled")}
                    className="px-3 py-1 bg-rose-600 text-white rounded text-sm hover:bg-rose-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGate>
  );
}