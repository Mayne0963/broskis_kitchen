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
    <div className="card">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="mr-2 text-white/80">Status</span>
          <select
            className="select min-w-[160px]"
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
          className="input min-w-[240px]"
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="ml-auto">
          <a href="/api/admin/catering/export" className="btn-primary">
            Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}