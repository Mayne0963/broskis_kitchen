"use client";
import { useEffect, useState, useMemo } from "react";
import type { CateringRequest, CateringStatus } from "@/types/catering";
import StatusBadge from "./StatusBadge";

export default function CateringTable({
  status,
  q,
  dateStart,
  dateEnd,
  density = "compact",
}: {
  status: string;
  q: string;
  dateStart?: string;
  dateEnd?: string;
  density?: "compact" | "comfy";
}) {
  const [rows, setRows] = useState<CateringRequest[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Row padding helper
  const cellPad = density === "compact" ? "py-2 px-3" : "py-3 px-4";

  // Bulk selection helpers
  const allRowIds = useMemo(() => rows.map(r => r.id), [rows]);
  const isAllSelected = allRowIds.length > 0 && allRowIds.every(id => selectedIds.has(id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allRowIds));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Clear selections when data changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [status, q]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Bulk actions
  const handleBulkAction = async (newStatus: CateringStatus) => {
    if (selectedIds.size === 0) return;
    
    setBulkLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/catering/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: newStatus
        })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const result = await res.json();
      setSuccessMessage(`Updated ${result.count} items to ${newStatus}`);
      setSelectedIds(new Set());
      
      // Refresh the table
      load(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to update items');
    } finally {
      setBulkLoading(false);
    }
  };

  // Skeleton rows helper function
  function SkeletonRow() {
    return (
      <tr className="border-b border-white/10">
        <td className={`${cellPad}`}><div className="skel h-4 w-4" /></td>
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
      if (dateStart) params.set("dateStart", dateStart);
      if (dateEnd) params.set("dateEnd", dateEnd);
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

  // reload when filters change (including date filters)
  useEffect(() => {
    setCursor(null);
    setSelectedIds(new Set()); // Clear selections when filters change
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, dateStart, dateEnd]);

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows]);

  return (
    <div className="card">
      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div 
          className="sticky top-0 z-20 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4 backdrop-blur"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-yellow-300 font-medium">
                {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('in_review')}
                  disabled={bulkLoading}
                  className="btn-ghost border border-white/20 hover:border-yellow-400/50 text-white hover:text-yellow-300 transition-colors disabled:opacity-50"
                  aria-label="Mark selected items as in review"
                >
                  {bulkLoading ? 'Updating...' : 'Mark In Review'}
                </button>
                <button
                  onClick={() => handleBulkAction('confirmed')}
                  disabled={bulkLoading}
                  className="btn-ghost border border-white/20 hover:border-yellow-400/50 text-white hover:text-yellow-300 transition-colors disabled:opacity-50"
                  aria-label="Mark selected items as confirmed"
                >
                  {bulkLoading ? 'Updating...' : 'Mark Confirmed'}
                </button>
                <button
                  onClick={() => handleBulkAction('archived')}
                  disabled={bulkLoading}
                  className="btn-ghost border border-white/20 hover:border-yellow-400/50 text-white hover:text-yellow-300 transition-colors disabled:opacity-50"
                  aria-label="Archive selected items"
                >
                  {bulkLoading ? 'Updating...' : 'Archive'}
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4 text-green-300">
          {successMessage}
        </div>
      )}

      <div className="overflow-auto rounded-md">
        <table className="w-full text-sm" role="table" aria-label="Catering requests">
          <thead
            className="sticky top-0 z-10 backdrop-blur"
            style={{ 
              background: "rgba(0,0,0,0.6)", 
              borderBottom: "1px solid var(--bk-border)",
              boxShadow: "0 6px 12px rgba(0,0,0,0.2)"
            }}
          >
            <tr
              className="[&>th]:text-left [&>th]:py-2 [&>th]:px-3 uppercase tracking-wide text-xs"
              style={{ color: "var(--bk-text-soft)" }}
            >
              <th className="w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-yellow-400 bg-transparent border-white/30 rounded focus:ring-yellow-400 focus:ring-2"
                  aria-label="Select all items"
                />
              </th>
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
                className={`tr-lift border-b ${i % 2 ? "bg-white/5" : "bg-transparent"} ${selectedIds.has(r.id) ? "bg-yellow-500/10" : ""}`}
                style={{ borderColor: "var(--bk-border)" }}
              >
                <td className="py-2 px-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => handleSelectRow(r.id)}
                    className="w-4 h-4 text-yellow-400 bg-transparent border-white/30 rounded focus:ring-yellow-400 focus:ring-2"
                    aria-label={`Select request ${r.id}`}
                  />
                </td>
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
                <td colSpan={9} className="py-8 text-center text-white/60">
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
