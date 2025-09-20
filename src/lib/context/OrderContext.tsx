"use client";

import React from "react";

type Order = any;

type OrdersState = {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const OrdersCtx = React.createContext<OrdersState | null>(null);

async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch("/api/orders", { credentials: "include", cache: "no-store" });
    if (!res.ok) {
      console.warn("orders fetch failed:", res.status);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.warn("orders fetch error:", e);
    return [];
  }
}

export function OrderProvider({
  autoLoad = false,
  children,
}: {
  autoLoad?: boolean;
  children: React.ReactNode;
}) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchOrders();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (autoLoad) {
      // fire and forget; no throws
      refresh().catch(() => setError("Failed to load orders"));
    }
  }, [autoLoad, refresh]);

  return (
    <OrdersCtx.Provider value={{ orders, loading, error, refresh }}>
      {children}
    </OrdersCtx.Provider>
  );
}

export function useOrders(): OrdersState {
  const ctx = React.useContext(OrdersCtx);
  if (!ctx) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return ctx;
}