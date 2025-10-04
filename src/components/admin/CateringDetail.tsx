"use client";
import { useEffect, useState } from "react";
import type { CateringRequest, CateringStatus } from "@/types/catering";
import StatusBadge from "./StatusBadge";

export default function CateringDetail({ id }: { id: string }) {
  const [item, setItem] = useState<CateringRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CateringStatus>("in_review");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (item) setLoaded(true);
  }, [item]);

  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const res = await fetch(`/api/admin/catering/${id}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setItem(data);
        setNotes(data.notes ?? "");
        setStatus(data.status);
      } catch (e: any) {
        setError(e?.message || "Failed to load request");
      }
    })();
  }, [id]);

  if (!loaded) {
    return (
      <div className="card space-y-5" aria-label="Loading request details">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="skel-line w-32 mb-2" />
            <div className="skel-line w-48" />
          </div>
          <div className="flex items-center gap-2">
            <div className="skel-line w-12" />
            <div className="skel h-6 w-16" />
          </div>
        </div>

        {/* Meta grid skeleton */}
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="skel-line w-16" />
            <div className="skel-line w-24" />
          </div>
          <div className="space-y-1">
            <div className="skel-line w-12" />
            <div className="skel-line w-20" />
          </div>
          <div className="space-y-1">
            <div className="skel-line w-14" />
            <div className="skel-line w-8" />
          </div>
          <div className="space-y-1">
            <div className="skel-line w-10" />
            <div className="skel-line w-16" />
          </div>
        </div>

        {/* Form skeleton */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="skel-line w-20 mb-2" />
            <div className="skel h-10 w-full" />
          </div>
          <div className="sm:col-span-2">
            <div className="skel-line w-24 mb-2" />
            <div className="skel h-28 w-full" />
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="flex gap-3">
          <div className="skel h-10 w-24" />
          <div className="skel h-10 w-20" />
        </div>
      </div>
    );
  }

  if (!item) return null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catering/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItem(data);
    } catch (e: any) {
      setError(e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">{item.name}</div>
          <div className="text-sm text-white/60">{item.email}</div>
        </div>
        <div>
          <span className="text-xs text-white/50 mr-2">Status</span>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <div className="text-white/50">Created</div>
          <div className="font-medium">
            {new Date(item.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-white/50">Event</div>
          <div className="font-medium">
            {item.eventDate ? new Date(item.eventDate).toLocaleDateString() : "—"}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-white/50">Guests</div>
          <div className="font-medium">{item.guestCount ?? "—"}</div>
        </div>

        <div className="space-y-1">
          <div className="text-white/50">Tier</div>
          <div className="font-medium capitalize">{item.packageTier ?? "—"}</div>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <div className="text-white/50">Selections</div>
          <div className="font-medium">
            {(item.selections ?? []).length
              ? (item.selections ?? []).join(", ")
              : "—"}
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-white/80">Update status</span>
          <select
            className="select mt-1 w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            aria-label="Update request status"
          >
            <option value="new">new</option>
            <option value="in_review">in_review</option>
            <option value="quoted">quoted</option>
            <option value="confirmed">confirmed</option>
            <option value="cancelled">cancelled</option>
            <option value="archived">archived</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm text-white/80">Admin notes</span>
          <textarea
            className="input mt-1 w-full h-28"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes for the team…"
            aria-label="Admin notes for this request"
          />
        </label>
      </div>

      {error && <p className="text-rose-300" role="alert">{error}</p>}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={save} 
          className="btn-primary" 
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <a href="/api/admin/catering/export" className="btn-ghost" aria-label="Export all catering requests as CSV">
          Export CSV
        </a>
      </div>
    </div>
  );
}
