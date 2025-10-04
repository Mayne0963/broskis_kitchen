"use client";
import { useEffect, useState } from "react";

export type Filters = { status: string; q: string };

export default function CateringFilters({
  initial,
  onChange,
}: {
  initial?: Partial<Filters>;
  onChange: (f: Filters) => void;
}) {
  const [status, setStatus] = useState(initial?.status ?? "all");
  const [q, setQ] = useState(initial?.q ?? "");

  useEffect(() => {
    const id = setTimeout(() => onChange({ status, q }), 200);
    return () => clearTimeout(id);
  }, [status, q, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm">
        <span className="mr-2">Status</span>
        <select
          className="border rounded px-2 py-1"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="in_review">In Review</option>
          <option value="quoted">Quoted</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="archived">Archived</option>
        </select>
      </label>

      <input
        className="border rounded px-2 py-1 min-w-[220px]"
        placeholder="Search name or email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <a
        href="/api/admin/catering/export"
        className="ml-auto border rounded px-3 py-1"
      >
        Export CSV
      </a>
    </div>
  );
}