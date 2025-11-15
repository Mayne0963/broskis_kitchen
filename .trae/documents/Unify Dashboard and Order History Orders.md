## Findings
- Dashboard uses server-side `getUserTotals(uid)` with `adminDb` and `where('userId','==', uid)` (src/lib/server/orderTotals.ts:43–59), authenticated via `withAuthGuard` that reads Firebase `__session` cookie.
- Order History page uses client-side `OrderTracking` which first attempts a Firestore client listener on `collection('orders').where('userId','==', userId)` (src/components/orders/OrderTracking.tsx:185–199). On `permission-denied`, it falls back to the API `/api/my-orders` (src/components/orders/OrderTracking.tsx:216–218).
- The `OrderProvider` fetches `/api/my-orders` (src/lib/context/OrderContext.tsx:18–41). That API uses `adminDb` and `getServerUser()` to resolve the user from the server cookie, then `where('userId','==', uid)` (src/app/api/my-orders/route.ts:72–86).
- Likely discrepancy root causes:
  - Client Firestore security rules prevent reading global `orders` → listener yields empty or errors while server queries succeed.
  - Session cookie not consistently present in client → `/api/my-orders` returns empty; dashboard still works because server page is gated via `withAuthGuard` using the cookie during SSR.
  - Minor data-shape divergences are handled, but not the authentication path alignment.

## Fix Plan
- Source-of-truth alignment: make both views use the same server API and userId-only queries.
- Order History data path:
  - Prefer `/api/my-orders` as the primary source; keep client Firestore listener only when `isFirebaseConfigured()` and rules allow, otherwise rely on API consistently.
  - Ensure `OrderHistoryPage` triggers a refresh after `useAuth` resolves and passes a validated `user.id`.
- Authentication consistency:
  - Confirm login flow sets the Firebase session cookie `__session` so server API can resolve the user reliably.
  - Propagate credentials on fetch (`credentials: 'include'`) and disable caching, already present in OrderProvider.
- Data parity:
  - Verify both `getUserTotals` and `/api/my-orders` use `userId` filter only.
  - Normalize response shape in `/api/my-orders` to the `Order` interface so UI shows consistent fields.
- Error handling:
  - Surface 401/403 and index/precondition errors in Order History UI with actionable messages; fallback to server API when client listener is denied.

## Implementation Steps
1. Update `OrderTracking` to prioritize API data, using the listener only as an enhancement when allowed; unify filter presets and saving with validated `userId`.
2. Ensure `/api/my-orders` strictly uses `userId` queries and returns consistent `orders: Order[]`.
3. Verify `withAuthGuard` and client `AuthGuard` produce a consistent session cookie; if missing, add a small helper to confirm cookie presence after login.
4. Add a lightweight store for shared orders so dashboard and order history can optionally read the same cached payload on navigation.

## Validation Tests
- Unit: compare counts
  - `getUserTotals(uid).ordersCount` equals `/api/my-orders` length for a seeded user.
- Integration: UI parity
  - Authenticated user sees the same number of orders on `/dashboard` and `/account/orders`.
  - Simulate denied Firestore read → Order History still shows orders via API fallback.
- Data update accuracy
  - Adding a new order increases both views consistently.
- Performance
  - Ensure no redundant queries: one API fetch + optional listener; measure render time under 100ms for 20 orders in local tests.

## Documentation
- Root cause: mixed data paths (server adminDb vs client Firestore) and session cookie inconsistency; client listener blocked by rules.
- Implementation details: unified `userId` filter, API-first for Order History, listener as enhancement, consistent error handling.
- Database/API changes: none beyond enforcing userId-only queries; confirm required composite index `(userId, createdAt desc)` exists.
- Testing methodology and results: outline unit/integration specs and parity metrics.

## Rollout & Verification
- Deploy API and UI changes together.
- Validate across browsers/devices; confirm cookie behavior in Safari/Chrome (SameSite and Secure flags).
- Monitor logs for 401/FAILED_PRECONDITION; add metrics for API latency and parity counts.

Please confirm this plan. Once approved, I will implement the changes, add tests, and document results, ensuring both views show identical orders backed by `userId`-based queries and robust error handling.