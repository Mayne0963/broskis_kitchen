## Frontend Changes
- API-first data load: In `OrderTracking` and `OrderHistoryPage`, call `/api/my-orders` with `credentials: 'include'`, `cache: 'no-store'` immediately after a valid `user.id` is available; keep the Firestore listener only as a progressive enhancement when rules permit.
- Robust states: 
  - Loading skeletons (list + summary) and a top-level spinner while first fetch runs.
  - Empty state with CTA and guidance when no orders are returned.
  - Error state with clear messages and a retry button (handles 401, 403, FAILED_PRECONDITION, network failures).
- Data display: Render date (from `createdAt`), items summary (name × qty), totals, status, order type, and delivery/pickup info; normalize to the `Order` interface already used across the app.
- Performance for 100+ orders:
  - Add pagination (server-side `limit=50` with `createdAt` cursor) or client infinite-scroll.
  - Use list virtualization (e.g., `react-virtual` or lightweight custom) to render only visible rows.
  - Defer heavy UI (maps/driver tracking) behind toggles.

## Firebase Configuration
- Security rules (current file `firestore.rules` are close):
  - Keep `orders` readable when `resource.data.userId == request.auth.uid` OR `admin/staff`.
  - Ensure `create` validates `userId == request.auth.uid`, `status` type, `createdAt` timestamp.
  - Confirm `update` allows only status/updatedAt changes for users; admins/staff can override.
- Indexes: Confirm composite index on `orders(userId ASC, createdAt DESC)` (present in `firestore.indexes.json`) and deploy; remove reliance on `userEmail` queries.
- Auth claims: Ensure admin/staff claims are set (script referenced in `FIREBASE_PRODUCTION_SETUP.md`). Verify SameSite/Secure cookie flags for `__session` across browsers.

## API Alignment
- `/api/my-orders`: Continue `where('userId','==', uid).orderBy('createdAt','desc').limit(50)`;
  - Add pagination support: `?cursor=<createdAt|docId>` for subsequent pages.
  - Map Firestore docs to strict `Order` shape; return `{ orders, nextCursor }`.
  - Error handling: index creation message for `FAILED_PRECONDITION`, 401/403 for auth.

## Testing
- Unit & integration (Vitest + RTL):
  - Parity: `getUserTotals(uid).ordersCount` equals `/api/my-orders` length for seeded user.
  - Roles: mock `admin/staff/user` tokens; ensure `orders` read access matches rules.
  - Statuses: render orders for `pending`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `completed`, `cancelled`.
  - Error paths: simulate 401, permission-denied, index-missing, network error; verify error banner and retry works.
- Performance:
  - Seed 100–200 orders; measure first paint < 2s with virtualization on typical hardware.
  - Verify API response < 500ms for 50 orders; scrolling remains fluid.

## Success Criteria & Verification
- Load time: Orders list initial render < 2s for typical datasets.
- Authorization: Only signed-in users see their own orders; admin/staff can read globally.
- Scale: 100+ orders render smoothly with pagination/infinite-scroll and virtualization.
- Status display: All supported statuses render correctly with consistent labels/colors.
- Error UX: Clear messaging and retry for network, permission, auth, and index issues.

## Rollout Plan
- Implement API-first behavior and pagination; retain Firestore listener as enhancement.
- Confirm rules and deploy composite index; set required claims for staff/admin.
- Add tests (parity, roles, statuses, error paths, performance checks) and run CI.
- Verify across Chrome, Safari, iOS/Android with session cookie settings.

If you approve, I will implement these changes, add tests, and verify performance and access controls end-to-end.