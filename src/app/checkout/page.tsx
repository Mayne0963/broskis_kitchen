"use client";
import { useState, useMemo } from "react";
import { useCart } from "../../lib/context/CartContext";
import { safeFetch } from "@/lib/utils/safeFetch";
import { AuthGuard } from "../../components/auth/AuthGuard";
import { loadSessionOrder } from "@/lib/utils/orderPersistence";

type OutItem = { name: string; price: number; qty: number };

function normalizePrice(p: unknown): number {
  const n = typeof p === "string" ? parseFloat(p.replace(/[^0-9.]/g, "")) : Number(p);
  return isFinite(n) ? n : 0;
}

function CheckoutContent() {
  const [loading, setLoading] = useState(false);
  const { items = [] } = useCart();
  const effectiveItems = useMemo(() => {
    if ((items?.length ?? 0) > 0) return items;
    const sessionOrder = loadSessionOrder();
    return sessionOrder?.items ?? [];
  }, [items]);

  const payloadItems: OutItem[] = useMemo(() => {
    return (effectiveItems || []).map((it: any) => ({
      name: String(it?.name ?? it?.title ?? "Item"),
      price: normalizePrice(it?.price ?? it?.unitPrice ?? it?.amount),
      qty: Math.max(1, Number(it?.qty ?? it?.quantity ?? 1)),
    })).filter(x => x.qty > 0 && x.price >= 0);
  }, [effectiveItems]);

  async function startPayment() {
    setLoading(true);
    try {
      console.log("[CHECKOUT] items count:", effectiveItems.length);
      console.log("[CHECKOUT] payload:", payloadItems);
      const res = await safeFetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });
      console.log("[CHECKOUT] API status:", res.status);
      const j = await res.json();
      console.log("[CHECKOUT] API response:", j);
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

export default function CheckoutPage() {
  return (
    <AuthGuard requireEmailVerification={true}>
      <CheckoutContent />
    </AuthGuard>
  );
}