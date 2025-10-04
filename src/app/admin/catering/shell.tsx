"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CateringFilters, { Filters } from "@/components/admin/CateringFilters";
import CateringTable from "@/components/admin/CateringTable";
import CateringDetail from "@/components/admin/CateringDetail";

export default function CateringDashboardClient({
  initialStatus = "all",
  initialQ = "",
  initialId,
}: {
  initialStatus?: string;
  initialQ?: string;
  initialId?: string;
}) {
  const [filters, setFilters] = useState<Filters>({
    status: initialStatus,
    q: initialQ,
  });

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
    (f: Filters) => {
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
      <CateringFilters initial={filters} onChange={handleFilters} />
      <CateringTable status={tableStatus} q={tableQ} />
      {activeId && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Request Detail</h2>
            <button
              className="border rounded px-3 py-1"
              onClick={() => pushQuery({ id: null })}
            >
              Close
            </button>
          </div>
          <CateringDetail id={activeId} />
        </div>
      )}
    </div>
  );
}