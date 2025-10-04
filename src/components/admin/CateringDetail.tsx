"use client";
import { useEffect, useState } from "react";
import type { CateringRequest, CateringStatus } from "@/types/catering";

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
    <div className="mt-6 space-y-3 border rounded p-4">
      <div className="text-lg font-semibold">
        {item.name} · {item.email}
      </div>
      <div>Created: {new Date(item.createdAt).toLocaleString()}</div>
      <div>
        Event:{" "}
        {item.eventDate
          ? new Date(item.eventDate).toLocaleDateString()
          : "—"}
      </div>
      <div>Guests: {item.guestCount ?? "—"}</div>
      <div>Tier: {item.packageTier ?? "—"}</div>
      <div>Selections: {(item.selections ?? []).join(", ") || "—"}</div>

      <label className="block">
        <span className="text-sm">Status</span>
        <br />
        <select
          className="border rounded px-2 py-1"
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

      <label className="block">
        <span className="text-sm">Admin notes</span>
        <br />
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={save}
        className="border rounded px-3 py-1"
        disabled={saving}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}