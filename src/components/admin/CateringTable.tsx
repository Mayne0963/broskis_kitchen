"use client";
import { useEffect, useState, useMemo } from "react";
import type { CateringRequest } from "@/types/catering";
import StatusBadge from "./StatusBadge";

export default function CateringTable({
  status,
  q,
}: {
  status: string;
  q: string;
}) {
  const [rows, setRows] = useState<CateringRequest[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-black/60 backdrop-blur border-b border-white/10">
            <tr className="[&>th]:text-left [&>th]:py-2 [&>th]:px-3 text-white/70">
              <th>Created</th>
              <th>Name</th>
              <th>Email</th>
              <th>Guests</th>
              <th>Tier</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                className={`border-b border-white/10 ${i % 2 ? "bg-white/5" : "bg-transparent"}`}
              >
                <td className="py-2 px-3 whitespace-nowrap">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                </td>
                <td className="px-3">{r.name}</td>
                <td className="px-3">{r.email}</td>
                <td className="px-3">{r.guestCount ?? "—"}</td>
                <td className="px-3 capitalize">{r.packageTier ?? "—"}</td>
                <td className="px-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-3 text-right">
                  <a className="btn-ghost" href={`/admin/catering?id=${r.id}`}>
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-rose-300 mt-3">{error}</p>}
      {empty && <p className="text-sm text-white/60 mt-3">No results.</p>}

      <div className="mt-3">
        {cursor && (
          <button
            onClick={() => load(false)}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}