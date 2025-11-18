# Order Visibility Fix – Root Cause and Solution

## Root Cause
1. Orders persisted in multiple locations: top-level `orders` and user subcollections `users/{uid}/orders`.
2. UID linking gaps: legacy orders stored with `userEmail` but missing `userId`, so UID-based queries returned zero.
3. Index requirements: queries combining `where(userId)` + `orderBy(createdAt)` and collection-group queries required composite indexes; when missing, queries failed.
4. Frontend listener overwrote API-loaded results with empty snapshots when client read rules blocked or returned no docs.

## Solution Overview
- API-first retrieval with robust fallbacks:
  - Query top-level `orders` by `userId` → fallback by `userEmail` → fallback via collection-group `orders`.
  - Structured logs include `pathUsed`, counts, and `nextCursor`.
- Frontend preservation:
  - Prevent empty Firestore snapshots from overwriting non-empty API results.
  - Dedupe when loading more; auto-switch to history when no active orders exist.
- Security & indexes:
  - Firestore rules allow owners/admin/staff to read `orders/{id}` and `users/{uid}/orders/{id}`.
  - Confirmed composite indexes and added friendly error messaging for index creation.

## Verification
- Tests added for email and collection-group fallbacks; parity and pagination tests already in place.
- Manual verification: `/api/my-orders` returns non-empty list with `pathUsed` indicating the fallback path used.

## Recommended Follow-Up
- Backfill `userId` on legacy email-only orders to enable clean UID-only retrieval and eventually remove email fallback.

## January 2025 Regression and Fix
- **Regression:** `/api/my-orders` removed the `userEmail` fallback after a partial backfill, so customers whose historical orders still lacked `userId` saw an empty history even though `/api/auth/status` confirmed they were logged in.
- **UI gap:** The manual refresh button still called the admin-only `/api/orders` endpoint, which always responded with a `501` for shoppers and overwrote the visible state with an error.
- **Fixes implemented:**
  - Re-enabled the email fallback (original + lower-cased candidate) and kept the collection-group fallback. Structured logs now note which path succeeded and when fallbacks return no docs.
  - Manual refresh now hits `/api/my-orders` and reuses the same flexible response parsing as the initial load so customers see the same data everywhere.
  - Added targeted Vitest coverage (`src/__tests__/myorders-fallbacks.test.ts`) to enforce the fallback order and avoid regressions if we change query code again.
- **Result:** Customers with legacy orders immediately see their history again and the refresh action no longer surfaces admin-only errors.
