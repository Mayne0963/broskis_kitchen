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
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          {item.name} · {item.email}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>Created: {new Date(item.createdAt).toLocaleString()}</div>
        <div>
          Event: {item.eventDate ? new Date(item.eventDate).toLocaleDateString() : "—"}
        </div>
        <div>Guests: {item.guestCount ?? "—"}</div>
        <div>Tier: <span className="capitalize">{item.packageTier ?? "—"}</span></div>
        <div className="sm:col-span-2">Selections: {(item.selections ?? []).join(", ") || "—"}</div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-white/80">Status</span>
          <select
            className="select mt-1 w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value as CateringStatus)}
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
          />
        </label>
      </div>

      {error && <p className="text-rose-300">{error}</p>}

      <div className="flex gap-3">
        <button onClick={save} className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <a href="/api/admin/catering/export" className="btn-ghost">Export CSV</a>
      </div>
    </div>
  );
}