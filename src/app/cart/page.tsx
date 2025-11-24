"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../lib/context/CartContext";
import { useAuth } from "../../lib/context/AuthContext";
import { OrderItem } from "../../types/order";
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowLeft, FaCreditCard, FaCog, FaLock } from "react-icons/fa";
import { safeFetch } from "../../lib/utils/safeFetch";
import { AuthGuard } from "../../components/auth/AuthGuard";
import { useOrderResumePrompt } from "@/hooks/useOrderResumePrompt";

function normalizePrice(p: unknown): number {
  const n = typeof p === "string" ? parseFloat(p.replace(/[^0-9.]/g, "")) : Number(p);
  return isFinite(n) ? n : 0;
}

function CartContent() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const { shouldPrompt, summary, accept, decline } = useOrderResumePrompt();

  function getItemTotal(item: OrderItem) {
    let total = Number(item?.price ?? 0);
    if (item?.customizations) {
      const values = Object.values(item.customizations);
      const flatOptions = ([] as any[]).concat(
        ...values.map(v => Array.isArray(v) ? v : [v].filter(Boolean))
      );
      flatOptions.forEach((option: any) => {
        const extra = Number(option?.price ?? 0);
        if (!isNaN(extra)) total += extra;
      });
    }
    const qty = Math.max(1, Number(item?.quantity ?? 1));
    return total * qty;
  }

  function getItemPrice(item: OrderItem) {
    let price = Number(item?.price ?? 0);
    if (item?.customizations) {
      const values = Object.values(item.customizations);
      const flatOptions = ([] as any[]).concat(
        ...values.map(v => Array.isArray(v) ? v : [v].filter(Boolean))
      );
      flatOptions.forEach((option: any) => {
        const extra = Number(option?.price ?? 0);
        if (!isNaN(extra)) price += extra;
      });
    }
    return price;
  }

  const payloadItems = useMemo(() => {
    return (items || []).map((it: any) => ({
      name: String(it?.name ?? it?.title ?? "Item"),
      price: normalizePrice(it?.price ?? it?.unitPrice ?? it?.amount),
      qty: Math.max(1, Number(it?.qty ?? it?.quantity ?? 1)),
    })).filter(x => x.qty > 0 && x.price >= 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return (items || []).reduce((sum, item) => sum + getItemTotal(item), 0);
  }, [items]);

  const tax = useMemo(() => subtotal * 0.0825, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  const isUnderMinimum = total < 0.5;

  async function proceedToCheckout() {
    setLoading(true);
    try {
      const res = await safeFetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });
      const j = await res.json();
      if (res.ok && j?.url) {
        window.location.href = j.url;
      } else {
        console.error("Checkout error:", j);
        if (j?.error?.includes("Minimum charge is $0.50")) {
          alert("Stripe requires a minimum charge of $0.50. Please add more items.");
        } else {
          alert(j?.error || "Unable to start checkout");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Network error starting checkout");
    } finally {
      setLoading(false);
    }
  }

  const handleQuantityChange = (id: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity);
    }
  };

  const handlePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim() === "") {
      setPromoError("Please enter a promo code");
      return;
    }
    setPromoError("Invalid promo code");
  };

  const hasCustomizations = (item: OrderItem) => {
    return item.customizations && Object.keys(item.customizations).length > 0;
  };


  if (items.length === 0) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
          <div className="bg-black rounded-lg p-12 text-center border border-[#FFD700]">
            <div className="w-20 h-20 bg-[#222222] rounded-full flex items-center justify-center mx-auto mb-6">
              <FaShoppingCart className="text-gray-500 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Looks like you haven&apos;t added any items to your cart yet.</p>
            <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
              <FaArrowLeft size={14} /> Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        {shouldPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-black border border-[#FFD700] rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-2">Continue previous order?</h2>
              <p className="text-gray-300 mb-4">{summary ? `${summary.items} items • $${summary.total.toFixed(2)}` : "A saved order was found."}</p>
              <div className="flex gap-2 justify-end">
                <button onClick={decline} className="btn-outline">No</button>
                <button onClick={accept} className="btn-primary">Yes</button>
              </div>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden border border-[#FFD700]">
              <div className="p-4 bg-black border-b border-[#FFD700] flex justify-between items-center">
                <h2 className="font-bold">Items ({items.length})</h2>
                <button onClick={clearCart} className="text-sm text-gray-400 hover:text-blood-red transition-colors">
                  Clear Cart
                </button>
              </div>

              <ul className="divide-y divide-[#333333]">
                {items.map((item, idx) => (
                  <li key={String(item?.id ?? idx)} className="p-4 flex flex-col">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-[#222222] rounded-lg overflow-hidden relative flex-shrink-0">
                        {item.image ? (
                          <Image src={item.image || "/placeholder.svg"} alt={String(item?.name || 'Item')} fill className="object-cover" unoptimized />
                          ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaShoppingCart className="text-gray-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{(typeof item?.name === 'string' ? item.name.split(" (")[0] : String(item?.name || 'Item'))}</h3>
                          {hasCustomizations(item) && (
                            <span className="bg-gold-foil bg-opacity-20 text-gold-foil text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <FaCog size={10} /> Customized
                            </span>
                          )}
                        </div>
                        <div className="text-gold-foil font-bold mt-1">${getItemPrice(item).toFixed(2)}</div>

                        {hasCustomizations(item) && (
                          <div className="mt-2 text-sm text-gray-400">
                            {Object.entries(item.customizations ?? {}).map(([category, options]) => (
                              <div key={category} className="mb-1">
                                <span className="text-xs text-gray-500 uppercase">{category}:</span>
                                {(Array.isArray(options) ? options : [options].filter(Boolean)).map((option: any, index: number) => (
                                  <div key={index} className="flex justify-between ml-2">
                                    <span>{option.name}</span>
                                    {Number(option?.price ?? 0) > 0 && <span className="text-gold-foil">+${Number(option.price).toFixed(2)}</span>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-[#FFD700] rounded-md">
                          <button
                            className="px-2 py-1 text-white hover:bg-[#333333] transition-colors"
                            onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                          >
                            <FaMinus size={12} />
                          </button>
                          <span className="px-3 py-1 text-white">{item.quantity}</span>
                          <button
                            className="px-2 py-1 text-white hover:bg-[#333333] transition-colors"
                            onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-blood-red transition-colors"
                          aria-label="Remove item"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <Link href="/menu" className="text-gold-foil hover:underline inline-flex items-center gap-2">
                <FaArrowLeft size={14} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-black rounded-lg border border-[#FFD700] p-6">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax (8.25%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                {!isAuthenticated ? (
                  <div className="pt-4 border-t border-[#333333]">
                    <div className="bg-[#111111] p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <FaLock className="text-gold-foil" />
                        <span className="text-sm font-medium">Promo Codes - Login Required</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        Sign in to apply promo codes and unlock exclusive discounts!
                      </p>
                      <div className="flex gap-2">
                        <Link href="/auth/login" className="btn-outline text-xs px-3 py-1 flex-1 text-center">
                          Login
                        </Link>
                        <Link href="/auth/signup" className="btn-primary text-xs px-3 py-1 flex-1 text-center">
                          Sign Up
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePromoCode} className="pt-4 border-t border-[#333333]">
                    <label className="block text-sm font-medium mb-2">Promo Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input flex-grow"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoError(null);
                        }}
                        placeholder="Enter code"
                      />
                      <button type="submit" className="btn-outline whitespace-nowrap">
                        Apply
                      </button>
                    </div>
                    {promoError && <p className="text-blood-red text-sm mt-1">{promoError}</p>}
                  </form>
                )}

                <div className="flex justify-between pt-4 border-t border-[#333333] font-bold">
                  <span>Total</span>
                  <span className="text-gold-foil">${total.toFixed(2)}</span>
                </div>
              </div>

              {isUnderMinimum && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-400 text-sm text-center">
                    Stripe requires a minimum charge of $0.50.
                  </p>
                </div>
              )}

              <button
                onClick={proceedToCheckout}
                disabled={loading || payloadItems.length === 0 || isUnderMinimum}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FaCreditCard /> {loading ? "Starting…" : "Proceed to Checkout"}
              </button>

              <div className="mt-3">
                <Link
                  href="/checkout"
                  className="btn-outline w-full inline-flex items-center justify-center gap-2"
                >
                  <FaCreditCard /> Pay In-App
                </Link>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">Taxes and shipping calculated at checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <AuthGuard requireEmailVerification={false}>
      <CartContent />
    </AuthGuard>
  );
}
