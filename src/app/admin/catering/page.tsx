"use client";
import { useEffect, useState } from "react";
import AdminGate from "@/components/auth/AdminGate";

export default function AdminCatering() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const u = new URL("/api/admin/catering/list", location.origin);
    if (status) u.searchParams.set("status", status);
    if (q) u.searchParams.set("q", q);
    try {
      const res = await fetch(u.toString()).then(r=>r.json());
      setItems(res.items || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const updateStatus = async (id: string, st: string) => {
    await fetch("/api/admin/catering/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: st })
    });
    await load();
  };

  const Row = ({ it }: { it: any }) => (
    <tr className="hover:bg-slate-900/40 cursor-pointer" onClick={() => setFocus(it)}>
      <td className="py-2 px-3">{it.createdAt?.slice(0, 10)}</td>
      <td className="px-3">{it.customer?.name}</td>
      <td className="px-3">{it.customer?.email}</td>
      <td className="px-3">{it.packageId}</td>
      <td className="px-3">{it.guests}</td>
      <td className="px-3 text-yellow-300">${it.price?.deposit}</td>
      <td className="px-3">
        <span className={`px-2 py-1 rounded text-xs ${getStatusClass(it.status)}`}>{it.status}</span>
      </td>
    </tr>
  );

  const getStatusClass = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-emerald-600/30 text-emerald-200";
      case "canceled": return "bg-rose-600/30 text-rose-200";
      case "quoted": return "bg-blue-600/30 text-blue-200";
      default: return "bg-slate-700/40 text-slate-200";
    }
  };

  return (
    <AdminGate>
      <div className="mx-auto max-w-6xl px-6 py-10 text-slate-100">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-300">Catering Admin</h1>
          <a href="/api/admin/catering/export" className="px-3 py-2 rounded bg-slate-800 border border-slate-600 hover:border-yellow-500">Export CSV</a>
        </div>

        <div className="mt-4 grid sm:grid-cols-4 gap-3">
          <input
            placeholder="Search name/email/address…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            className="sm:col-span-3 rounded-lg bg-slate-900 border border-slate-700 p-2"
          />
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg bg-slate-900 border border-slate-700 p-2">
            <option value="">All statuses</option>
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
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-left px-3">Name</th>
                <th className="text-left px-3">Email</th>
                <th className="text-left px-3">Package</th>
                <th className="text-left px-3">Guests</th>
                <th className="text-left px-3">Deposit</th>
                <th className="text-left px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td className="p-4" colSpan={7}>Loading…</td></tr> : items.map(it => <Row key={it.id} it={it} />)}
            </tbody>
          </table>
        </div>

        {focus && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setFocus(null)}>
            <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-[#0B0F15] border-l border-slate-800 p-5" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-yellow-300">#{focus.id?.slice(-6)}</h2>
                <button onClick={() => setFocus(null)} className="text-slate-400">Close</button>
              </div>
              <div className="mt-3 text-sm text-slate-300">
                <div><strong>Customer:</strong> {focus.customer?.name} · {focus.customer?.email} · {focus.customer?.phone || "—"}</div>
                <div className="mt-2"><strong>Event:</strong> {focus.event?.date} @ {focus.event?.address}</div>
                <div className="mt-2"><strong>Package:</strong> {focus.packageId} · Guests {focus.guests}</div>
                <div className="mt-2"><strong>Menu:</strong>
                  <ul className="list-disc pl-5 mt-1">{["meats", "sides", "drinks", "appetizers", "desserts"].map(k => focus.menu?.[k]?.length ? <li key={k}>{k}: {focus.menu[k].join(", ")}</li> : null)}</ul>
                </div>
                <div className="mt-2"><strong>Totals:</strong> ${focus.price?.subtotal} · Deposit ${focus.price?.deposit}</div>
                {focus?.stripe?.checkoutUrl && <a target="_blank" rel="noreferrer" href={focus.stripe.checkoutUrl} className="mt-2 inline-block text-emerald-300 underline">Open Stripe Checkout</a>}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => updateStatus(focus.id, "quoted")} className="rounded-xl bg-blue-600/20 border border-blue-500/40 px-3 py-2 text-blue-200">Mark Quoted</button>
                <button onClick={() => updateStatus(focus.id, "confirmed")} className="rounded-xl bg-emerald-600/20 border border-emerald-500/40 px-3 py-2 text-emerald-200">Confirm</button>
                <button onClick={() => updateStatus(focus.id, "canceled")} className="rounded-xl bg-rose-600/20 border border-rose-500/40 px-3 py-2 text-rose-200">Cancel</button>
                <button onClick={() => navigator.clipboard.writeText(focus.customer?.email || "")} className="rounded-xl bg-slate-800 border border-slate-600 px-3 py-2">Copy Email</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGate>
  );
}