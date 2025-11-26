"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/context/CartContext";

const lunchDropItems = [
  {
    id: "ld-wingz-10pc",
    name: "Broski's Wingz™ Plate",
    description: "10pc award-winning Broski's Wingz™ with Broski Dust fries and bread.",
    price: 15,
  },
  {
    id: "ld-wingz-6pc",
    name: "6pc Broski's Wingz™",
    description: "6pc Broski's Wingz™ with Broski Dust fries.",
    price: 12,
  },
  {
    id: "ld-salmon-bowl",
    name: "Broski Salmon Bowl",
    description: "Grilled salmon over rice with Broski veggies and drizzle sauce.",
    price: 18,
  },
];

export default function LunchOrderPage() {
  const router = useRouter();
  const { addItem, clearCart } = useCart();

  const [quantities, setQuantities] = React.useState<Record<string, number>>(
    Object.fromEntries(lunchDropItems.map((item) => [item.id, 0]))
  );

  const handleChangeQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      const updated = Math.max(0, (next[id] || 0) + delta);
      next[id] = updated;
      return next;
    });
  };

  const selectedItems = lunchDropItems.filter((item) => (quantities[item.id] || 0) > 0);
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] || 0),
    0
  );

  const handleProceedToCheckout = () => {
    // Mirror existing cart flow: clear then add items, go to checkout
    clearCart();
    selectedItems.forEach((item) => {
      const qty = quantities[item.id] || 0;
      if (qty > 0) {
        addItem({ id: item.id, name: item.name, price: item.price, quantity: qty });
      }
    });
    router.push("/checkout?source=lunchdrop");
  };

  return (
    <div className="page page-lunchorder">
      <div className="lunchorder-hero">
        <p className="lunchorder-kicker">Broski&apos;s Lunch Drop™</p>
        <h1 className="lunchorder-title">Place Your Lunch Drop Order</h1>
        <p className="lunchorder-text">
          Choose your plate for tomorrow&apos;s Lunch Drop. Orders must be placed the
          day before. Your workplace orders together — first shift to hit the goal
          locks in the Drop with free OTW delivery.
        </p>
      </div>

      <div className="lunchorder-grid">
        {lunchDropItems.map((item) => (
          <div key={item.id} className="lunchorder-card">
            <h2 className="lunchorder-item-name">{item.name}</h2>
            <p className="lunchorder-item-desc">{item.description}</p>
            <p className="lunchorder-item-price">${item.price}</p>
            <div className="lunchorder-qty-row">
              <button type="button" className="qty-btn" onClick={() => handleChangeQty(item.id, -1)}>
                -
              </button>
              <span className="qty-value">{quantities[item.id] || 0}</span>
              <button type="button" className="qty-btn" onClick={() => handleChangeQty(item.id, 1)}>
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="lunchorder-summary">
        <div className="lunchorder-summary-text">
          <p className="lunchorder-summary-label">Selected items</p>
          {selectedItems.length === 0 ? (
            <p className="lunchorder-summary-empty">No items selected yet.</p>
          ) : (
            <ul className="lunchorder-summary-list">
              {selectedItems.map((item) => (
                <li key={item.id}>
                  {item.name} × {quantities[item.id] || 0}
                </li>
              ))}
            </ul>
          )}
          <p className="lunchorder-subtotal">Subtotal: ${subtotal.toFixed(2)}</p>
        </div>
        <button
          type="button"
          className="btn-primary lunchorder-checkout-btn"
          onClick={handleProceedToCheckout}
          disabled={selectedItems.length === 0}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

