## Overview
Build an admin Orders dashboard that mirrors the existing catering admin UI and styling while adapting the data and interactions to regular customer orders.

## UI & Styling
- Reuse catering visual system: color tokens, typography, button/table classes used in `AdminClient` and `CateringTable`.
- Components to create:
  - `src/components/admin/OrdersFilters.tsx`: search, status, date range, payment status, density.
  - `src/components/admin/OrdersTable.tsx` (extend existing one): list of orders with selectable rows, sorting, pagination.
  - `src/components/admin/OrderDetail.tsx`: side sheet with order details, items, totals, delivery/pickup info, payment status, and status update buttons.
  - `src/app/admin/orders/page.tsx`: Admin gate + shell, composes Filters, Table, and Detail.
- Status visuals: reuse `StatusBadge`/`StatusPill` styles mapped to order statuses (`pending`, `paid`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `completed`, `cancelled`).

## Data & Features
- Data source: `src/app/api/admin/orders/route.ts` (already available) returns normalized fields.
- Filters:
  - Free-text search (`q`) across id, userName, userId, status.
  - Status filter (select), date range (`from`/`to`), payment status.
  - Density toggle for table rows.
- Sorting: by `createdAt` (newest/oldest), by status, by total.
- Bulk actions: (optional phase 2) set status for selected orders (PATCH `api/admin/orders/status` to be added later).
- Detail sheet:
  - Shows Order ID, customer name/id, contact info, items (name × qty × price), delivery/pickup details.
  - Status update buttons (allowed transitions), payment status indicator.
  - Timestamps: createdAt, updatedAt.

## Responsiveness & Accessibility
- Responsive grid like catering admin: table scroll container, sticky headers, compact/comfy density.
- Accessibility (WCAG 2.1 AA):
  - Proper `role="table"`, `aria-label`, keyboard focus states.
  - Color contrast aligned with catering palette; badges meet contrast.
  - Focus management inside detail sheet; `aria-live` for success/error messages.

## Performance
- Pagination with `cursor` (append or reset) to avoid loading entire dataset.
- Virtualization (optional phase 2) via simple windowing for large tables.
- `cache: 'no-store'` for admin freshness; minimize rerenders with `useMemo`.

## Auth & Security
- Page uses server `ensureAdmin` or `withAuthGuard({allowedRoles:['admin']})` to restrict access.
- API already checks admin; continue to rely on it; add client-side AdminGate for UX.

## Implementation Steps
1) Create `src/app/admin/orders/page.tsx` with admin guard and shell.
2) Implement `OrdersFilters.tsx` patterned on `CateringFilters.tsx` for search/status/date/payment.
3) Extend `src/components/admin/OrdersTable.tsx` to accept admin order fields; preserve catering table styling (sticky header, compact density).
4) Add `OrderDetail.tsx` side sheet mirroring `AdminClient` detail layout; include status update buttons and payment indicator.
5) Wire filters → table load using `q`, `status`, `from`, `to` (and `paymentStatus`) against `api/admin/orders`.
6) Add pagination (`nextCursor` support) and load-more.

## Testing
- Unit/RTL:
  - Render dashboard and verify styles match catering classes.
  - Orders list shows id, customer, items count/summary, status badge, totals.
  - Filters change query params and refresh results.
  - Detail sheet displays itemized order info; buttons present.
- Parity & compatibility:
  - Compare key UI tokens/classnames against catering page.
  - Basic cross-browser checks (Chrome/Safari/Firefox) using Playwright/puppeteer stubs (if available) or documented manual steps.

## Deliverables
- New admin Orders dashboard page and components.
- Reused/consistent styling with catering.
- Tests for UI consistency, data display, filters, pagination.

## Rollout
- Implement components and page; run tests; push.
- Validate with a few production orders; confirm admin-only access.

Approve to proceed with implementation across the specified files; I will deliver the working dashboard with tests aligned to the catering UI.