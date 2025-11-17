## Diagnosis
- Orders not appearing:
  - `/api/my-orders` returns empty or "User not authenticated" when the server cannot read the Firebase session cookie, even though the `auth/status` page shows authenticated JSON. This points to inconsistent auth paths: `auth/status` reads the session cookie correctly, but `/api/my-orders` sometimes gets no cookie and does not receive a Bearer token.
  - Response mapping differences across historical documents (items missing `quantity` or `price`) produce UI failures; normalize fields.
- Auth discrepancy between `api/me` and `auth/status`:
  - No `/api/auth/me` endpoint; the app uses `/api/me` and `/api/auth/status`. Some client code may still call `/api/auth/me`, which will fail silently or 404.
  - Session cookie (`__session`) is set as `SameSite=Lax`, `Secure` (prod); requests must include credentials. If a client fetch omits `credentials: 'include'`, endpoints won’t see the cookie.

## Fix Plan
1) Auth consistency
- Ensure all client fetches to authenticated endpoints set `credentials: 'include'` and, when possible, attach `Authorization: Bearer <ID token>` as a fallback (OrderTracking already does this).
- Standardize the auth info endpoint: prefer `/api/auth/status`; update any client calls referencing `/api/auth/me` to `/api/me` or `/api/auth/status`.
- Verify `/api/my-orders` path reads cookie; keep Bearer token fallback.

2) Orders API completeness
- Normalize response fields in `/api/my-orders`:
  - Ensure `items[]` include `{ name, quantity, price }` from mixed historical shapes (`name/title`, `qty/quantity`, `priceCents/price`).
  - Ensure `orderType` uses a consistent key (`orderType` or fallback to `type`).
  - Ensure `contactInfo` always includes `{ email, phone, name }` using `userEmail/userPhone/userName` fallback.
  - Confirm `total` is computed when missing.
- Maintain fallbacks in retrieval:
  - Query top-level `orders` by `userId`; fallback to collection-group `users/{uid}/orders`.
  - Keep email fallback enabled until you approve the full backfill.
- Add structured logs: `pathUsed`, counts, cursor tokens.

3) Frontend
- Ensure OrderTracking always renders and preserves API results when the snapshot is empty.
- Confirm status mapping (`out_for_delivery`) for badges/sorting.
- Default filters to neutral; auto-switch tabs if no active orders but completed exists.

4) Error handling & logging
- Add clear UI messages for 401/403, index missing (`FAILED_PRECONDITION`), and network failures; provide retry.
- Server logs: log auth source (cookie vs Bearer), `pathUsed`, and error causes.

5) Testing
- Unit/integration:
  - Fallback tests: email and collection-group results set `pathUsed` appropriately.
  - Parity: dashboard totals equal `/api/my-orders` length.
  - Pagination: `nextCursor` loads additional pages, deduping items.
  - Auth consistency: ensure endpoints read session cookie and accept Bearer tokens.
- Cross-browser: manual checks on Chrome/Safari/Firefox with cookies allowed.

6) Documentation
- Record root causes and fixes: session cookie path/credentials mismatch, legacy orders lacking `userId`, index requirements, field normalization.
- Provide runbook for diagnosing cookie issues and confirming index status.

## Execution
- Update client calls to use `/api/auth/status` and `credentials: 'include'` consistently; fix any `/api/auth/me` references.
- Verify `/api/my-orders` completeness and add logs.
- Confirm frontend preservation and status mapping.
- Add/extend tests and docs.

Approve and I will implement these changes, run tests, and provide verification logs showing orders appear and auth status is consistent across endpoints.