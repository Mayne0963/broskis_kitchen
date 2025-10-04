"use client";
import { useEffect, useState, useMemo } from "react";
import type { CateringRequest } from "@/types/catering";

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
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-black/10">
            <tr className="[&>th]:text-left [&>th]:py-2">
              <th>Created</th>
              <th>Name</th>
              <th>Email</th>
              <th>Guests</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                </td>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.guestCount ?? "—"}</td>
                <td className="capitalize">{r.packageTier ?? "—"}</td>
                <td>
                  <span className="uppercase text-[11px] px-2 py-1 border rounded">
                    {r.status}
                  </span>
                </td>
                <td>
                  <a className="underline" href={`/admin/catering?id=${r.id}`}>
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-red-500 mt-3">{error}</p>}

      {empty && <p className="text-sm text-neutral-500 mt-3">No results.</p>}

      <div className="mt-3">
        {cursor && (
          <button
            onClick={() => load(false)}
            className="border rounded px-3 py-1"
            disabled={loading}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}