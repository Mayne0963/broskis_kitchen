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