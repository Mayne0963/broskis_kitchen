"use client";
import { useEffect, useState, useMemo } from "react";
import type { CateringRequest } from "@/types/catering";
import StatusBadge from "./StatusBadge";

export default function CateringTable({
  status,
  q,
  density = "compact",
}: {
  status: string;
  q: string;
  density?: "compact" | "comfy";
}) {
  const [rows, setRows] = useState<CateringRequest[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Row padding helper
  const cellPad = density === "compact" ? "py-2 px-3" : "py-3 px-4";

  // Skeleton rows helper function
  function SkeletonRow() {
    return (
      <tr className="border-b border-white/10">
        <td className={`${cellPad}`}><div className="skel-line w-28" /></td>
        <td className={`${cellPad}`}><div className="skel-line w-32" /></td>
        <td className={`${cellPad}`}><div className="skel-line w-40" /></td>
        <td className={`${cellPad}`}><div className="skel-line w-10" /></td>
        <td className={`${cellPad}`}><div className="skel-line w-16" /></td>
        <td className={`${cellPad}`}><div className="skel-line w-20" /></td>
        <td className={`${cellPad}`}><div className="skel h-5 w-16" /></td>
        <td className={`${cellPad} text-right`}><div className="skel h-8 w-16 ml-auto" /></td>
      </tr>
    );
  }

  async function load(reset = false) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      if (!reset && cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/admin/catering?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRows((prev) => (reset ? data.items : [...prev, ...data.items]));
      setCursor(data.nextCursor);
    } catch (e: any) {
      setError(e?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  // reload when filters change
  useEffect(() => {
    setCursor(null);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows]);

  return (
    <div className="card">
      <div className="overflow-auto rounded-md">
        <table className="w-full text-sm" role="table" aria-label="Catering requests">
          <thead
            className="sticky top-0 z-10 backdrop-blur"
            style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid var(--bk-border)" }}
          >
            <tr
              className="[&>th]:text-left [&>th]:py-2 [&>th]:px-3 uppercase tracking-wide text-xs"
              style={{ color: "var(--bk-text-soft)" }}
            >
              <th>Created</th>
              <th>Name</th>
              <th>Email</th>
              <th>Guests</th>
              <th>Tier</th>
              <th>Total</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {/* Loading state */}
            {loading && rows.length === 0 && (
              <>
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </>
            )}

            {/* Data rows */}
            {!loading && rows.map((r, i) => (
              <tr
                key={r.id}
                className={`tr-lift border-b ${i % 2 ? "bg-white/5" : "bg-transparent"}`}
                style={{ borderColor: "var(--bk-border)" }}
              >
                <td className="py-2 px-3 whitespace-nowrap">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                </td>
                <td className="px-3">{r.customer?.name ?? "—"}</td>
                <td className="px-3">{r.customer?.email ?? "—"}</td>
                <td className="px-3">{r.event?.guests ?? "—"}</td>
                <td className="px-3 capitalize">{r.packageTier ?? "—"}</td>
                <td className="px-3">
                  {typeof r.price?.total === "number"
                    ? new Intl.NumberFormat(undefined, { style: "currency", currency: r.price?.currency || "USD" }).format(r.price.total)
                    : "—"}
                </td>
                <td className="px-3"><StatusBadge status={r.status as any} /></td>
                <td className="px-3 text-right">
                  <a
                    className="btn-ghost border"
                    style={{ borderColor: "var(--bk-border)", color: "var(--bk-silver)" }}
                    href={`/admin/catering?id=${r.id}`}
                    aria-label={`View request ${r.id}`}
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}

            {/* Empty state */}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-white/60">
                  No requests match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="text-rose-300 mt-4 px-4">{error}</p>}

      {cursor && (
        <div className="mt-3">
          <button
            onClick={() => load(false)}
            className="btn-primary"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
