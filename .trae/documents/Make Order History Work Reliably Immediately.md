## Root Cause
- Not a data absence: orders exist (dashboard shows counts), but Order History API often returns empty because the server fails to identify the user.
- Reason: missing/expired `__session` cookie on some flows. Client Firestore reads may also be blocked by rules or missing index (FAILED_PRECONDITION).

## Immediate Fix (Server + Client)
- Server fallback auth: Update `/api/my-orders` to accept `Authorization: Bearer <Firebase ID token>` when the session cookie is missing; verify with `adminAuth.verifyIdToken` and continue using `userId` query.
- Client sends ID token: In `OrderProvider.fetchOrders`, get current Firebase ID token and attach `Authorization: Bearer <token>` header to `/api/my-orders`.
- Listener fallback: In `OrderTracking` snapshot error handler, also fallback to API when error code/message indicates an index is required (`failed-precondition` / 'requires an index').

## Firebase Double-Check
- Rules: Keep existing rule allowing reads when `resource.data.userId == request.auth.uid` or admin/staff (already configured).
- Indexes: Ensure `(userId ASC, createdAt DESC)` index deployed (firestore.indexes.json present). Confirm on prod; if not, deploy.

## Testing & Verification
- Integration: Authenticated user with valid orders sees identical order sets on dashboard and Order History; simulate missing cookie → still works via Authorization header.
- Error paths: Permission denied and index required errors trigger API fallback; ensure friendly UI messages + retry.
- Performance: Verify first load < 2s and pagination handles 100+ orders smoothly.

## Steps
1) Modify `/api/my-orders` to verify Authorization Bearer token when cookie missing.
2) Update `OrderProvider.fetchOrders` to attach ID token; keep `credentials:'include'`.
3) Enhance `OrderTracking` error fallback for `failed-precondition`.
4) Re-run parity, fallback, and pagination tests; validate on staging with real Firebase.

Approve and I will implement immediately, verify it works on your site, and double-check Firebase rules and indexes on production.