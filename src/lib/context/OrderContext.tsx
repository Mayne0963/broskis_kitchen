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
    // Prefer user-specific orders to avoid admin requirement
    const res = await fetch("/api/my-orders", { credentials: "include", cache: "no-store" });
    if (!res.ok) {
      console.warn("orders fetch failed:", res.status);
      if (res.status === 401) {
        throw new Error("Please log in to view your orders");
      }
      throw new Error(`Failed to fetch orders: ${res.status}`);
    }
    const json = await res.json();
    // Support both { orders: [...] } and raw array shapes
    const arr = Array.isArray(json) ? json : Array.isArray(json?.orders) ? json.orders : [];
    return arr;
  } catch (e) {
    console.warn("orders fetch error:", e);
    throw e; // Re-throw the error so it can be handled by the caller
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
    try {
      const data = await fetchOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setError(error.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
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