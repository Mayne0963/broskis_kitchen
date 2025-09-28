"use client";
import { useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

type Item = any;

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<Item | null>(null);

  async function load() {
    setLoading(true);
    const u = new URL("/api/admin/catering/list", location.origin);
    if (q) u.searchParams.set("q", q);
    if (st) u.searchParams.set("status", st);
    const r = await fetch(u.toString()).then(r => r.json());
    setItems(r.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [st]);

  async function setStatus(id: string, s: string) {
    await fetch("/api/admin/catering/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: s })
    });
    load();
  }

  const Badge = ({ v }: { v: string }) => (
    <span className={`px-2 py-1 rounded text-xs capitalize ${
      v === "confirmed" ? "bg-emerald-600/30 text-emerald-200" :
      v === "quoted" ? "bg-blue-600/30 text-blue-200" :
      v === "canceled" ? "bg-rose-600/30 text-rose-200" : "bg-slate-700/40 text-slate-200"
    }`}>
      {v}
    </span>
  );

  return (
    <AdminGate>
      <div className="mx-auto max-w-6xl px-6 py-10 text-slate-100">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-300">Catering Admin</h1>
          <a 
            href="/api/admin/catering/export" 
            className="px-3 py-2 rounded bg-slate-800 border border-slate-600 hover:border-yellow-500 transition-colors"
          >
            Export CSV
          </a>
        </div>
        
        <div className="mt-6 grid sm:grid-cols-4 gap-3">
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && load()} 
            placeholder="Search…" 
            className="sm:col-span-3 rounded bg-slate-900 border border-slate-700 p-2 text-slate-100 placeholder-slate-400 focus:border-yellow-500 focus:outline-none"
          />
          <select 
            value={st} 
            onChange={e => setSt(e.target.value)} 
            className="rounded bg-slate-900 border border-slate-700 p-2 text-slate-100 focus:border-yellow-500 focus:outline-none"
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
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Pkg</th>
                <th className="p-3 text-left">Guests</th>
                <th className="p-3 text-left">Deposit</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : (
                items.map((it: any) => (
                  <tr 
                    key={it.id} 
                    onClick={() => setFocus(it)} 
                    className="border-b border-slate-800 hover:bg-slate-900/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3">{(it.createdAt || "").slice(0, 10)}</td>
                    <td className="p-3">{it.customer?.name}</td>
                    <td className="p-3">{it.customer?.email}</td>
                    <td className="p-3 capitalize">{it.packageId}</td>
                    <td className="p-3">{it.guests}</td>
                    <td className="p-3 text-yellow-300">${it.price?.deposit}</td>
                    <td className="p-3"><Badge v={it.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {focus && (
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setFocus(null)}>
            <div 
              className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-[#0B0F15] border-l border-slate-800 p-5 overflow-y-auto" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-yellow-300">
                  Req #{focus.id?.slice(-6)}
                </h2>
                <button 
                  onClick={() => setFocus(null)} 
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
              
              <div className="mt-3 text-sm text-slate-300 space-y-3">
                <div>
                  <strong>Customer:</strong> {focus.customer?.name} · {focus.customer?.email}
                </div>
                <div>
                  <strong>Phone:</strong> {focus.customer?.phone}
                </div>
                <div>
                  <strong>Event:</strong> {focus.event?.date} {focus.event?.startTime} @ {focus.event?.address}
                </div>
                <div>
                  <strong>Package:</strong> {focus.packageId} · Guests {focus.guests}
                </div>
                
                {focus.menu && (
                  <div>
                    <strong>Menu:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      {["meats", "sides", "drinks", "appetizers", "desserts"].map(k => (
                        focus.menu?.[k]?.length ? (
                          <li key={k} className="capitalize">
                            {k}: {focus.menu[k].join(", ")}
                          </li>
                        ) : null
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <strong>Totals:</strong> ${focus.price?.subtotal} · Deposit ${focus.price?.deposit}
                </div>
                
                {focus?.stripe?.checkoutUrl && (
                  <a 
                    href={focus.stripe.checkoutUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-emerald-300 underline hover:text-emerald-200 transition-colors"
                  >
                    Stripe Checkout
                  </a>
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <button 
                    onClick={() => setStatus(focus.id, "quoted")} 
                    className="px-3 py-2 rounded bg-blue-600/20 border border-blue-500/40 text-blue-200 hover:bg-blue-600/30 transition-colors"
                  >
                    Quote
                  </button>
                  <button 
                    onClick={() => setStatus(focus.id, "confirmed")} 
                    className="px-3 py-2 rounded bg-emerald-600/20 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30 transition-colors"
                  >
                    Confirm
                  </button>
                  <button 
                    onClick={() => setStatus(focus.id, "canceled")} 
                    className="px-3 py-2 rounded bg-rose-600/20 border border-rose-500/40 text-rose-200 hover:bg-rose-600/30 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>