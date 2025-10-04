"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import CateringFilters, { type Filters } from "@/components/admin/CateringFilters";
import CateringTable from "@/components/admin/CateringTable";
import CateringDetail from "@/components/admin/CateringDetail";

export default function AdminCateringClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get current state from URL
  const currentFilters: Filters = useMemo(() => ({
    status: searchParams.get("status") || "all",
    q: searchParams.get("q") || "",
  }), [searchParams]);

  const selectedId = searchParams.get("id");

  // Update URL when filters change
  const handleFiltersChange = useCallback((filters: Filters) => {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== "all") {
      params.set("status", filters.status);
    }
    
    if (filters.q) {
      params.set("q", filters.q);
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
    
    if (currentFilters.status && currentFilters.status !== "all") {
      params.set("status", currentFilters.status);
    }
    
    if (currentFilters.q) {
      params.set("q", currentFilters.q);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/catering";
    router.push(newUrl);
  }, [router, currentFilters]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <CateringFilters
        initial={currentFilters}
        onChange={handleFiltersChange}
      />

      {/* Detail View or Table */}
      {selectedId ? (
        <div>
          <div className="mb-4">
            <button
              onClick={handleCloseDetail}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to list
            </button>
          </div>
          <CateringDetail id={selectedId} />
        </div>
      ) : (
        <CateringTable
          status={currentFilters.status === "all" ? "" : currentFilters.status}
          q={currentFilters.q}
        />
      )}
    </div>
  );
}