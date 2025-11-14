## Root Cause
- Admin dashboard client expects `/api/orders` to return `{ ok: true, orders }`, but the API returns `{ orders }` without `ok`. This prevents orders from being set in state.

## Files Involved
- `src/app/admin/AdminDashboardClient.tsx` — fetches orders and renders table
- `src/app/api/orders/route.ts` — returns `{ orders }` for admin users
- `src/app/admin/page.tsx` — loads `AdminDashboardClient` after role check

## Changes
### AdminDashboardClient
- Update `fetchOrders()` to:
  - Use `response.ok` for status check instead of `data.ok`
  - Support both `{ orders }` and raw array shapes
  - Provide clear error and empty-state feedback

Code (patch-level intent):
```
// Before
const response = await safeFetch('/api/orders');
const data = await response.json();
if (data.ok) {
  setOrders(data.orders);
} else {
  console.error('Failed to fetch orders:', data.error);
}

// After
const response = await safeFetch('/api/orders');
if (!response.ok) {
  console.error('Failed to fetch orders:', response.status);
  setLoading(false);
  return;
}
const data = await response.json();
const list = Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : [];
setOrders(list);
setLoading(false);
```

### Optional API Alignment (deferred)
- Keep API unchanged (`{ orders }`) to minimize backend changes. If desired later, add `ok: true` for consistency with item routes.

## Verification
- Navigate to `/admin`:
  - Logged-in admin sees orders table populated.
  - Non-admin is redirected by `requireRole(["admin"])` in `src/app/admin/page.tsx:15`.
- Call `/api/orders` directly: returns JSON with `orders`; client handles it.
- Update status from the table triggers `/api/orders/[id]` which returns `{ ok: true, order }` (already aligned with client).

## Rollback
- If unintended effects, revert the `fetchOrders()` changes in `AdminDashboardClient.tsx`. No server/API changes included in this plan.
