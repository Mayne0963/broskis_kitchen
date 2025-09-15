"use client";
import { useState, useMemo } from "react";
import { useCart } from "../../lib/context/CartContext";

type OutItem = { name: string; price: number; qty: number };

function normalizePrice(p: unknown): number {
  const n = typeof p === "string" ? parseFloat(p.replace(/[^0-9.]/g, "")) : Number(p);
  return isFinite(n) ? n : 0;
}

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const { items = [] } = useCart();

  const payloadItems: OutItem[] = useMemo(() => {
    return (items || []).map((it: any) => ({
      name: String(it?.name ?? it?.title ?? "Item"),
      price: normalizePrice(it?.price ?? it?.unitPrice ?? it?.amount),
      qty: Math.max(1, Number(it?.qty ?? it?.quantity ?? 1)),
    })).filter(x => x.qty > 0 && x.price >= 0);
  }, [items]);

  async function startPayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });
      const j = await res.json();
      if (j?.url) window.location.href = j.url;
      else alert(j?.error || "Checkout failed");
    } catch {
      alert("Checkout error");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || payloadItems.length === 0;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
      <button
        onClick={startPayment}
        disabled={disabled}
        className="rounded-md bg-[#E9B949] px-6 py-3 font-semibold text-black hover:opacity-90 disabled:opacity-60"
      >
        {disabled ? "No items in cart" : (loading ? "Starting…" : "Proceed to Payment")}
      </button>
    </main>
  );
}