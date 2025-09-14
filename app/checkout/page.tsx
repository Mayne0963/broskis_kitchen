"use client";
import { useState } from "react";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  async function startPayment() {
    setLoading(true);
    try {
      // TODO: replace with real cart
      const items = [{ name: "Order", price: 12.99, qty: 1 }];
      const r = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const j = await r.json();
      if (j?.url) window.location.href = j.url;
      else alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
      <button onClick={startPayment} disabled={loading}
        className="rounded-md bg-[#E9B949] px-6 py-3 font-semibold text-black hover:opacity-90 disabled:opacity-60">
        {loading ? "Starting…" : "Proceed to Payment"}
      </button>
    </main>
  );
}