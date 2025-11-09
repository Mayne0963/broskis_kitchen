"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { safeFetch } from "@/lib/safeFetch";

type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type UserProfile = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
};

type OrderSummary = {
  id: string;
  status: string;
  total?: number;
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginBottom: 24 }}>
    <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</h2>
    <div style={{ border: "1px solid #333", borderRadius: 8, padding: 12 }}>{children}</div>
  </section>
);

export default function VendorsPage() {
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<ApiState<UserProfile>>({ data: null, loading: true, error: null });
  const [orders, setOrders] = useState<ApiState<OrderSummary[]>>({ data: null, loading: true, error: null });

  // SSR guard to avoid any window usage during server render
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const abort = new AbortController();

    // Load vendor profile (using /api/me as a safe baseline)
    (async () => {
      try {
        const res = await safeFetch("/api/me", { method: "GET", signal: abort.signal });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Profile request failed (${res.status}): ${txt}`);
        }
        const json = (await res.json()) as UserProfile;
        setProfile({ data: json, loading: false, error: null });
      } catch (err: any) {
        setProfile({ data: null, loading: false, error: err?.message || "Failed to load profile" });
        console.error("[vendors] profile load error", err);
      }
    })();

    // Load vendor orders (gracefully handle missing route or auth)
    (async () => {
      try {
        const res = await safeFetch("/api/orders", { method: "GET", signal: abort.signal });
        if (!res.ok) {
          // Do not crash; show friendly error
          const txt = await res.text().catch(() => "");
          throw new Error(`Orders request failed (${res.status}): ${txt}`);
        }
        const json = (await res.json()) as OrderSummary[];
        setOrders({ data: json, loading: false, error: null });
      } catch (err: any) {
        setOrders({ data: [], loading: false, error: err?.message || "Failed to load orders" });
        console.warn("[vendors] orders load warning", err);
      }
    })();

    return () => abort.abort();
  }, [isClient]);

  const role = useMemo(() => profile.data?.role || "guest", [profile.data]);

  return (
    <main style={{ padding: 16, maxWidth: 1024, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Vendors Dashboard</h1>

      <Section title="Profile">
        {profile.loading && <p>Loading profile…</p>}
        {!profile.loading && profile.error && (
          <p style={{ color: "#f66" }}>Error loading profile: {profile.error}</p>
        )}
        {!profile.loading && !profile.error && (
          <div>
            <p><strong>Name:</strong> {profile.data?.name || "—"}</p>
            <p><strong>Email:</strong> {profile.data?.email || "—"}</p>
            <p><strong>Role:</strong> {role}</p>
            {role !== "vendor" && (
              <p style={{ color: "#caa" }}>
                You are not marked as a vendor. If this is incorrect, please contact support.
              </p>
            )}
          </div>
        )}
      </Section>

      <Section title="Orders">
        {orders.loading && <p>Loading orders…</p>}
        {!orders.loading && orders.error && (
          <p style={{ color: "#f66" }}>Unable to load orders: {orders.error}</p>
        )}
        {!orders.loading && !orders.error && (
          <div>
            {orders.data && orders.data.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {orders.data.map((o) => (
                  <li key={o.id} style={{ padding: "8px 0", borderBottom: "1px solid #222" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Order #{o.id}</span>
                      <span>Status: {o.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No orders to display.</p>
            )}
          </div>
        )}
      </Section>

      <Section title="Menu Management">
        <p>
          Manage your menu items and availability.
          {" "}
          <Link href="/admin/menu-drops" style={{ color: "#6cf" }}>Open Menu Drops</Link>
        </p>
      </Section>
    </main>
  );
}