"use client";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then(r => r.json());

export default function CateringAdminView({ adminEmail }: { adminEmail: string }) {
  const { data, error, isLoading } = useSWR("/api/admin/catering/list", fetcher);
  
  if (isLoading) return <p className="text-zinc-300">Loading…</p>;
  if (error) return <p className="text-red-400">Error loading catering: {String(error)}</p>;
  if (!data?.items?.length) return <p className="text-zinc-400">No catering orders yet.</p>;
  
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Admin: Catering</h1>
      <p className="text-sm text-zinc-400">Signed in as {adminEmail} (admin)</p>
      <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
        {data.items.map((d: any) => (
          <li key={d.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{d.customer?.name || "Unknown"}</div>
              <div className="text-xs text-zinc-400">
                {d.status} • {new Date(d.createdAt._seconds ? d.createdAt._seconds * 1000 : d.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="text-right text-sm">
              <div>{d.packageId} • guests: {d.guests ?? "-"}</div>
              <div className="text-zinc-400">{d.address?.city || ""}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}