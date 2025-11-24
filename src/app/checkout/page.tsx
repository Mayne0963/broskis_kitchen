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
  // New Lunch Drop fields and basic contact info
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [workplaceName, setWorkplaceName] = useState("");
  const [workplaceShift, setWorkplaceShift] = useState("");
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

  const total = useMemo(() => payloadItems.reduce((sum, it) => sum + it.price * it.qty, 0), [payloadItems]);

  // Compute delivery date label (display-only badge)
  const deliveryDateLabel = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    return tomorrow.toLocaleDateString(undefined, options);
  }, []);

  async function startPayment() {
    setLoading(true);
    try {
      console.log("[CHECKOUT] items count:", effectiveItems.length);
      console.log("[CHECKOUT] payload:", payloadItems);
      // Fire-and-forget POST to /api/order to include Lunch Drop fields
      // Does not change existing checkout flow
      try {
        const body = {
          customerName: customerName || null,
          phone: phone || null,
          email: email || null,
          items: payloadItems.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
          total,
          workplaceName: workplaceName || null,
          workplaceShift: workplaceShift || "",
        };
        // Send without blocking checkout redirect
        fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch(() => {});
      } catch (e) {
        console.warn("[CHECKOUT] POST /api/order failed", e);
      }
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

      {/* Contact & Lunch Drop Fields */}
      <div className="bg-black/30 rounded-lg p-4 border border-gray-700 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Workplace Name (Optional)</label>
            <input
              type="text"
              value={workplaceName}
              onChange={(e) => setWorkplaceName(e.target.value)}
              placeholder="Where do you work?"
              className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-harvest-gold)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Workplace Shift</label>
            <select
              value={workplaceShift}
              onChange={(e) => setWorkplaceShift(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-dark-charcoal)] border border-gray-600 rounded-lg text-white focus:border-[var(--color-harvest-gold)] focus:outline-none"
            >
              <option value="">Select a shift (optional)</option>
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="3rd">3rd</option>
            </select>
          </div>
        </div>
      </div>

      {/* Totals and Delivery Date Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-white">
          <span className="text-sm text-gray-400 mr-2">Total:</span>
          <span className="text-lg font-semibold">${(total || 0).toFixed(2)}</span>
        </div>
        <div className="px-3 py-1 rounded-lg border border-[var(--color-harvest-gold)]/30 bg-black/30 text-[var(--color-harvest-gold)] text-sm">
          Delivery Date: <b>{deliveryDateLabel}</b>
        </div>
      </div>

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