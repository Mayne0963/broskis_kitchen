## Diagnosis
- Console error: `TypeError: null is not an object (evaluating 'x.useId.E')`.
- Running React `19.0.0` and Next `15.1.3` per package.json; admin pages use SWR and forwardRef UI components.
- Likely source: DOM/hook mismatch in React 19 during hydration for libraries that assume React 18 hook shapes (e.g., SWR, some UI helpers calling `useId`).

## Fix Strategy (Non-breaking First)
1) Replace SWR in admin KPI with controlled fetch
- File: `src/components/kpi/AdminKPI.tsx`
- Remove `useSWR`; implement `useEffect` + `useState` fetch with robust error handling, loading states, and abort controller to avoid hydration/strict mode double-invoke edge cases.
- Benefits: avoids library hook internals triggering React 19 incompatibilities.

2) Guard forwardRef UI usage
- File: `src/components/ui/card.tsx`
- Keep forwardRef (it’s fine) but ensure no implicit `useId` usage; the current card components are safe — just confirm they remain client-only when used in admin.

3) Harden admin page wrapper
- File: `src/app/admin/dashboard/page.tsx`
- Wrap KPIs with a lightweight client-only loader/fallback to avoid hydration mismatch glitches.
- Ensure the page doesn’t mount SWR anywhere transitively (AdminDashboardClient imports should be audited to avoid SWR).

4) Add defensive error handling
- In `AdminKPI`, catch and surface fetch errors; prevent uncaught exceptions.
- Keep global boundaries but ensure admin-specific content doesn’t trip them.

5) Optional: Library version alignment
- If SWR is required elsewhere, upgrade to the latest compatible version known to work with React 19. If incompatibility persists, migrate those usages to the controlled fetch pattern.

6) Fallback (if issues persist)
- Pin React/ReactDOM to `18.3.1` and Next to a stable compatible version (e.g., Next 14.2.x) as a last resort, given known React 19 adoption issues in certain libraries.

## Implementation Details
- `src/components/kpi/AdminKPI.tsx` (replace SWR)
```tsx
"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, DollarSign, Users } from 'lucide-react';

export default function AdminKPI() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/orders?kpi=1', { credentials: 'include', signal: ac.signal });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const kpi = data?.kpi ?? { totalOrders: 0, revenueCents: 0, activeUsers: 0 };
  const revenue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((kpi.revenueCents || 0) / 100);

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><div className="text-center text-red-600"><p>Error loading admin metrics</p><p className="text-sm">{error}</p></div></CardContent></Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total Orders" value="Loading..." icon={BarChart3} />
        <KpiCard label="Revenue" value="Loading..." icon={DollarSign} />
        <KpiCard label="Active Users" value="Loading..." icon={Users} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KpiCard label="Total Orders" value={kpi.totalOrders ?? 0} icon={BarChart3} />
      <KpiCard label="Revenue" value={revenue} icon={DollarSign} />
      <KpiCard label="Active Users" value={kpi.activeUsers ?? 0} icon={Users} />
    </div>
  );
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );
}
```

- `src/app/admin/dashboard/page.tsx`
  - Ensure this page only imports the client AdminKPI and doesn’t transitively import SWR or unstable APIs elsewhere. Keep existing error boundaries.

## Verification
- Load admin pages and confirm:
  - No “Something went wrong” fallback appears.
  - Console has no `useId` TypeError.
  - KPIs load correctly; error and loading states behave.
- Test other admin components (cards, tables) for hydration stability.

## Documentation
- Cause: React 19 changed hook internals; libraries using assumptions about hook shapes (SWR, some UI helpers) caused null dereferences during hydration (`useId`).
- Solution: Remove SWR usage from admin KPIs; rely on controlled fetch and guard client-only rendering paths.
- Edge cases: Strict mode double-invocations, aborted fetches, and transient network errors are handled; if other SWR usages remain and cause issues, migrate similarly or upgrade SWR.

## Optional Fallback
- If React 19 incompatibilities persist in other parts, pin `react`/`react-dom` to `18.3.1` and align Next to a stable compatible version (Next 14.2.x) until all libraries support React 19 cleanly.