"use client";

import { useState, useEffect } from "react";
import { CATERING_PACKAGES, ADDONS, MIN_GUESTS } from "@/config/catering";

export default function Catering() {
  const [pkg, setPkg] = useState("standard");
  const [guests, setGuests] = useState(50);
  const [addons, setAddons] = useState([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "" });
  const [event, setEvent] = useState({ date: "", address: "" });

  useEffect(() => {
    fetch("/api/catering/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: pkg, guests, addons })
    })
      .then(r => r.json())
      .then(setEstimate);
  }, [pkg, guests, addons]);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/catering/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        event,
        packageId: pkg,
        guests,
        addons,
        menu: {}
      })
    });
    const d = await res.json();
    setLoading(false);
    if (d?.stripe?.checkoutUrl) {
      window.location.href = d.stripe.checkoutUrl;
    } else {
      alert("Submitted!");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 text-slate-100">
      <h1 className="text-4xl font-bold text-yellow-300">Broski's Catering</h1>
      <p className="mt-2 text-slate-400">
        Luxury street-gourmet for events &amp; celebrations.
      </p>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {CATERING_PACKAGES.map(p => (
          <button
            key={p.id}
            onClick={() => setPkg(p.id)}
            className={`p-4 rounded-2xl border ${
              pkg === p.id ? "border-yellow-400" : "border-slate-700"
            } bg-[#0B0F15]`}
          >
            <div className="text-xl font-semibold text-yellow-300">{p.name}</div>
            <div>${p.pricePerGuest}/guest</div>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <label>
          Guests
          <input
            type="number"
            min={MIN_GUESTS}
            value={guests}
            onChange={e => setGuests(+e.target.value)}
            className="block mt-1 p-2 rounded bg-slate-900"
          />
        </label>
      </div>

      <div className="mt-4">
        <h2 className="text-lg">Add-ons</h2>
        {ADDONS.map(a => (
          <label key={a.id} className="block mt-1">
            <input
              type="checkbox"
              checked={addons.some(x => x.id === a.id)}
              onChange={e =>
                setAddons(s =>
                  e.target.checked
                    ? [...s, { id: a.id, qty: 1 }]
                    : s.filter(x => x.id !== a.id)
                )
              }
            />
            {" "}
            {a.name} ${a.price}
          </label>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-xl">Estimate</h3>
        {estimate && (
          <div>
            Subtotal ${estimate.subtotal} | Deposit ${estimate.deposit}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-2">
        <input
          placeholder="Name"
          onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
          className="p-2 rounded bg-slate-900"
        />
        <input
          placeholder="Email"
          onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))}
          className="p-2 rounded bg-slate-900"
        />
        <input
          placeholder="Event date"
          type="date"
          onChange={e => setEvent(ev => ({ ...ev, date: e.target.value }))}
          className="p-2 rounded bg-slate-900"
        />
        <input
          placeholder="Address"
          onChange={e => setEvent(ev => ({ ...ev, address: e.target.value }))}
          className="p-2 rounded bg-slate-900"
        />
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black"
      >
        {loading ? "Processing…" : "Reserve with Deposit"}
      </button>
    </div>
  );
}