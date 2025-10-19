"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CateringFilters from "@/components/admin/CateringFilters";
import CateringTable from "@/components/admin/CateringTable";
import CateringDetail from "@/components/admin/CateringDetail";
import type { CateringFilters as CateringFiltersType } from "@/types/catering";

export default function CateringDashboardClient({
  initialStatus = "all",
  initialQ = "",
  initialId,
}: {
  initialStatus?: string;
  initialQ?: string;
  initialId?: string;
}) {
  const [filters, setFilters] = useState<CateringFiltersType>({
    status: initialStatus,
    q: initialQ,
  });

  const [density, setDensity] = useState<"compact" | "comfy">("compact");

  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // keep ?status=&q=&id= in the URL (shareable/dashboard-friendly)
  const pushQuery = useCallback(
    (next: Partial<{ status: string; q: string; id?: string | null }>) => {
      const params = new URLSearchParams(search?.toString());
      if (typeof next.status !== "undefined") params.set("status", next.status!);
      if (typeof next.q !== "undefined") params.set("q", next.q!);
      if (typeof next.id !== "undefined") {
        if (next.id) params.set("id", next.id);
        else params.delete("id");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, search]
  );

  // initialize ID from SSR param
  const [activeId, setActiveId] = useState<string | null>(initialId ?? null);

  // reflect filter changes into URL
  const handleFilters = useCallback(
    (f: CateringFiltersType) => {
      setFilters(f);
      pushQuery({ status: f.status, q: f.q });
    },
    [pushQuery]
  );

  // clicking "View" in table uses normal <a href="?id=">. Sync local state from URL:
  useEffect(() => {
    const id = search?.get("id") || null;
    setActiveId(id);
  }, [search]);

  const tableStatus = useMemo(() => filters.status, [filters]);
  const tableQ = useMemo(() => filters.q, [filters]);

  return (
    <div className="space-y-4">
      <CateringFilters 
        filters={filters} 
        onFiltersChange={handleFilters}
        onExport={() => {}} 
        isExporting={false}
      />
      
      <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="uppercase tracking-wide text-xs text-white/60">Showing requests</div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-xs text-white/60">Density</span>
              <select
                aria-label="Row density"
                className="bg-neutral-800 border border-white/10 rounded px-3 py-1 text-white text-sm focus:border-yellow-400 focus:outline-none transition-colors"
                value={density}
                onChange={(e) => setDensity(e.target.value as any)}
              >
                <option value="compact">Compact</option>
                <option value="comfy">Comfy</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      
      <CateringTable 
        status={tableStatus || "all"} 
        q={tableQ || ""} 
        dateStart={filters.dateStart}
        dateEnd={filters.dateEnd}
        density={density} 
      />
      {activeId && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Request Detail</h2>
              <button
                className="bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 px-4 py-2 rounded transition-colors"
                onClick={() => pushQuery({ id: null })}
                aria-label="Close detail"
              >
                Close
              </button>
            </div>
          </div>
          <CateringDetail id={activeId} />
        </div>
      )}
    </div>
  );
}
