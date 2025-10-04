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
      <div className="bg-neutral-900 border border-white/10 rounded-lg p-6 space-y-5" aria-label="Loading request details">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
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
          <div className="space-y-1">
            <div className="skel-line w-18" />
            <div className="skel-line w-24" />
          </div>
          <div className="space-y-1">
            <div className="skel-line w-12" />
            <div className="skel-line w-20" />
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
    <div className="bg-neutral-900 border border-white/10 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="text-lg font-semibold text-white">{item.customer?.name ?? item.name ?? "—"}</div>
          <div className="text-sm" style={{ color: "var(--bk-text-dim)" }}>{item.customer?.email ?? item.email ?? "—"}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wide text-xs text-white/60">Status</span>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Meta grid - Enhanced with nested data */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Event Location</div>
          <div className="text-white">{item.event?.address ?? "—"}</div>
        </div>
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Event Date</div>
          <div className="text-white">{item.event?.date ? new Date(item.event.date).toLocaleDateString() : 
                       item.eventDate ? new Date(item.eventDate).toLocaleDateString() : "—"}</div>
        </div>
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Guests</div>
          <div className="text-white">{item.event?.guests ?? item.guestCount ?? "—"}</div>
        </div>
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Customer</div>
          <div className="text-white">{item.customer?.name ?? item.name ?? "—"}</div>
        </div>
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Email</div>
          <div className="text-white">{item.customer?.email ?? item.email ?? "—"}</div>
        </div>
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Package Tier</div>
          <div className="text-white capitalize">{item.packageTier ?? "—"}</div>
        </div>
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Total Price</div>
          <div className="text-yellow-400 font-semibold">{item.price?.total 
            ? new Intl.NumberFormat(undefined, { 
                style: "currency", 
                currency: item.price?.currency || "USD", 
              }).format(item.price.total)
            : item.totalEstimate 
              ? new Intl.NumberFormat(undefined, { 
                  style: "currency", 
                  currency: "USD", 
                }).format(item.totalEstimate)
              : "—"}</div>
        </div>
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Current Status</div>
          <div className="text-white capitalize">{item.status}</div>
        </div>
        <div className="bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Stripe Checkout</div>
          <div>
            {item.stripe?.checkoutUrl 
              ? <a href={item.stripe.checkoutUrl} className="text-yellow-400 hover:text-yellow-300 underline transition-colors" target="_blank" rel="noopener noreferrer">View Checkout</a> 
              : <span className="text-white/40">—</span>}
          </div>
        </div>
        
        {/* Additional price breakdown if available */}
        {item.price && (
          <>
            {item.price.perGuest && (
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Per Guest</div>
                <div className="text-yellow-400 font-medium">{new Intl.NumberFormat(undefined, { 
                  style: "currency", 
                  currency: item.price?.currency || "USD", 
                }).format(item.price.perGuest)}</div>
              </div>
            )}
            {item.price.deposit && (
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Deposit</div>
                <div className="text-yellow-400 font-medium">{new Intl.NumberFormat(undefined, { 
                  style: "currency", 
                  currency: item.price?.currency || "USD", 
                }).format(item.price.deposit)}</div>
              </div>
            )}
            {item.price.addons > 0 && (
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Add-ons</div>
                <div className="text-yellow-400 font-medium">{new Intl.NumberFormat(undefined, { 
                  style: "currency", 
                  currency: item.price?.currency || "USD", 
                }).format(item.price.addons)}</div>
              </div>
            )}
          </>
        )}
        
        <div className="sm:col-span-2 lg:col-span-3 bg-white/5 p-3 rounded border border-white/10">
          <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Created</div>
          <div className="text-white">{new Date(item.createdAt).toLocaleString()}</div>
        </div>
        
        {/* Legacy selections if available */}
        {item.selections && item.selections.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-3 bg-white/5 p-3 rounded border border-white/10">
            <div className="uppercase tracking-wide text-xs text-white/60 mb-1">Selections</div>
            <div className="text-white">{item.selections.join(", ")}</div>
          </div>
        )}
      </div>

      {/* Editable fields */}
      <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
        <label className="block">
          <span className="uppercase tracking-wide text-xs text-white/60 mb-2 block">Update Status</span>
          <select
            className="w-full bg-neutral-800 border border-white/10 rounded px-3 py-2 text-white focus:border-yellow-400 focus:outline-none transition-colors"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            aria-label="Update request status"
          >
            <option value="new">new</option>
            <option value="in_review">in_review</option>
            <option value="quoted">quoted</option>
            <option value="confirmed">confirmed</option>
            <option value="paid">paid</option>
            <option value="cancelled">cancelled</option>
            <option value="archived">archived</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="uppercase tracking-wide text-xs text-white/60 mb-2 block">Admin Notes</span>
          <textarea
            className="w-full bg-neutral-800 border border-white/10 rounded px-3 py-2 text-white h-28 focus:border-yellow-400 focus:outline-none transition-colors resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes for the team…"
            aria-label="Admin notes for this request"
          />
        </label>
      </div>

      {error && <p className="text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded p-3" role="alert">{error}</p>}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
        <button
          onClick={save}
          className="btn border-[1.5px]"
          disabled={saving}
          aria-busy={saving}
          style={{
            background: "linear-gradient(180deg, rgba(241,196,83,0.22), rgba(241,196,83,0.12))",
            borderColor: "var(--bk-gold)",
            color: "#1a1400",
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <a 
          href="/api/admin/catering/export" 
          className="bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 px-6 py-2 rounded transition-colors" 
          aria-label="Export all catering requests as CSV"
        >
          Export CSV
        </a>
      </div>
    </div>
  );
}
