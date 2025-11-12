"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import CateringFilters from "@/components/admin/CateringFilters";
import CateringTable from "@/components/admin/CateringTable";
import CateringDetail from "@/components/admin/CateringDetail";
import type { CateringFilters as CateringFiltersType } from "@/types/catering";

export default function AdminCateringClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  // Get current state from URL
  const currentFilters: CateringFiltersType = useMemo(() => ({
    status: searchParams?.get("status") || undefined,
    q: searchParams?.get("q") || undefined,
    dateStart: searchParams?.get("dateStart") || undefined,
    dateEnd: searchParams?.get("dateEnd") || undefined,
    datePreset: searchParams?.get("datePreset") || undefined,
  }), [searchParams]);

  const selectedId = searchParams?.get("id");

  // Update URL when filters change (and reset pagination)
  const handleFiltersChange = useCallback((filters: CateringFiltersType) => {
    const params = new URLSearchParams();
    
    if (filters.status) {
      params.set("status", filters.status);
    }
    
    if (filters.q) {
      params.set("q", filters.q);
    }

    if (filters.dateStart) {
      params.set("dateStart", filters.dateStart);
    }

    if (filters.dateEnd) {
      params.set("dateEnd", filters.dateEnd);
    }

    if (filters.datePreset) {
      params.set("datePreset", filters.datePreset);
    }

    // Keep the selected ID if it exists
    if (selectedId) {
      params.set("id", selectedId);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/catering";
    router.push(newUrl);
  }, [router, selectedId]);

  // Close detail view
  const handleCloseDetail = useCallback(() => {
    const params = new URLSearchParams();
    
    if (currentFilters.status) {
      params.set("status", currentFilters.status);
    }
    
    if (currentFilters.q) {
      params.set("q", currentFilters.q);
    }

    if (currentFilters.dateStart) {
      params.set("dateStart", currentFilters.dateStart);
    }

    if (currentFilters.dateEnd) {
      params.set("dateEnd", currentFilters.dateEnd);
    }

    if (currentFilters.datePreset) {
      params.set("datePreset", currentFilters.datePreset);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/catering";
    router.push(newUrl);
  }, [router, currentFilters]);

  // Handle CSV export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      
      if (currentFilters.status) {
        params.set("status", currentFilters.status);
      }
      
      if (currentFilters.q) {
        params.set("q", currentFilters.q);
      }

      if (currentFilters.dateStart) {
        params.set("dateStart", currentFilters.dateStart);
      }

      if (currentFilters.dateEnd) {
        params.set("dateEnd", currentFilters.dateEnd);
      }

      const exportUrl = `/api/admin/catering/export?${params.toString()}`;
      const res = await fetch(exportUrl, { method: 'GET', cache: 'no-store' });
      if (!res.ok) {
        alert(res.status === 403 ? 'Admin access required' : 'Failed to export CSV');
        return;
      }
      window.open(exportUrl, '_blank');
    } catch (error) {
      alert('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  }, [currentFilters]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <CateringFilters
        filters={currentFilters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Detail View or Table */}
      {selectedId ? (
        <div>
          <div className="mb-4">
            <button
              onClick={handleCloseDetail}
              className="text-gold hover:text-gold/80 underline bg-black/50 px-4 py-2 rounded-lg border border-gold/20"
            >
              ← Back to list
            </button>
          </div>
          <CateringDetail id={selectedId} />
        </div>
      ) : (
        <CateringTable
          status={currentFilters.status || ""}
          q={currentFilters.q || ""}
          dateStart={currentFilters.dateStart}
          dateEnd={currentFilters.dateEnd}
        />
      )}
    </div>
  );
}
