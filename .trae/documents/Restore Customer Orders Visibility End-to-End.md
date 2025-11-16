## Overview

Orders are persisted but not consistently retrieved for users due to UID linking gaps, mixed storage locations, index requirements, and occasional auth/session variance. We’ll audit the full flow, harden retrieval, improve logging/error handling, add tests, and document the fix.

## Step 1: Data Flow Verification

* Inspect recent Stripe webhook writes (top‑level `orders` and `users/{uid}/orders`) for fields: `userId`, `userEmail`, `createdAt`, `status`, `items`.
* Check for duplicates across `session.id` vs `payment_intent.id` and reconcile.
* Confirm normalization logic attempts email→user UID linking when possible.

## Step 2: Retrieval & Rules/Indexes

* Validate `/api/my-orders` works under three paths: UID on top‑level `orders`, email fallback on legacy docs, collection group on `users/{uid}/orders`.
* Confirm required composite indexes are active: `(orders) userId+createdAt`, `(orders) userEmail+createdAt`, and collection group `orders` with `createdAt`.
* Keep Firestore rules enabling owner/admin/staff read for both locations.

## Step 3: Fixes & Hardening

* Auth: Ensure API identifies user by cookie or Authorization Bearer token (already supported).
* Retrieval: Keep UID‑first; retain email fallback; add collection‑group fallback; dedupe results; include structured logs (uid, pathUsed, count).
* Frontend: API‑first fetch; prevent empty listener snapshots overwriting non‑empty results; neutral filters (All Types/Statuses) and auto‑switch to History when only completed orders exist.
* Error Handling: Surface index errors, permission denied, and 401/403 with actionable messages; add debug toggle to print counts.
* Performance: Confirm cursor pagination (`nextCursor`) and limit cap; avoid overfetch.

## Step 4: Optional Backfill (Recommended)

* Backfill legacy orders: where `userEmail==X` and missing `userId`, set `userId` to the owner’s UID; mirror into `users/{uid}/orders/{orderId}` or consolidate to a single source of truth.
* After backfill, remove email fallback to rely on UID exclusively.

## Step 5: Testing

* Unit/integration tests:
  * Parity: dashboard totals equal `/api/my-orders` length.
  * Fallbacks: index missing/permission denied returns orders via API.
  * Pagination: `nextCursor` loads additional pages.
  * Mount: OrderTracking renders without TDZ or runtime errors; status mapping correct.
* E2E/manual:
  * Authenticated user sees orders in Account and Admin views; cross‑browser cookie/token path.

## Step 6: Documentation

* Root cause: UID linking gaps + storage location mismatch + index requirements + auth/session variance.
* Solution: Hardened retrieval, logging, error handling, optional backfill, and index/rules verification.
* Runbook: How to check auth, API logs (`pathUsed`, counts), indexes, and Firestore storage.

## Rollout

* Implement and verify changes.
* (If approved) run backfill; re‑test; consider removing email fallback thereafter.

Approve to proceed; I’ll implement the fixes, add tests, and produce the documentation with verification logs demonstrating orders appearing reliably for signed‑in users.
