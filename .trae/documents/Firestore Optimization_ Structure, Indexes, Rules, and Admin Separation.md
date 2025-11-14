## Overview
- Optimize Firestore for faster reads and simpler maintenance by restructuring collections, tightening security rules, refining indexes, and cleanly separating admin-only data.
- Changes are delivered in phases with migration-safe toggles to preserve backward compatibility and measurable performance improvements.

## Current State Snapshot
- Config and initialization spread across client and server:
  - Client SDK: `src/lib/firebase/client.ts`, `src/lib/services/firebase.ts`, `src/lib/firebaseClient.ts`, `src/lib/firebase-simple.ts`
  - Admin SDK: `src/lib/firebase/admin.ts`, `src/lib/firebase-admin.ts`, `firebase/admin.ts`
- Collections in use include `users`, `orders`, rewards-related (`rewardTransactions`, `spinHistory`, etc.), `coupons`, `offers`, `menuDrops`, plus analytics and operational collections.
- Security rules present in `firestore.rules`; composite indexes in `firestore.indexes.json`; emulators configured in `firebase.json`.

## Phase 1: Database Cleanup
1. Audit and field usage mapping
- Trace queries in `src/lib/services/*.ts` to enumerate fields actually read/written (orders, rewards, coupons, offers, menu drops, analytics).
- Produce a per-collection field map: required, optional, unused.

2. Flatten nested maps used for querying
- Migrate fields currently queried via nested maps to top-level (e.g., `customer.email` → `customerEmail`) to reduce composite index complexity and improve read latency.
- Keep truly relational data in subcollections where needed (e.g., `users/{id}/transactions`).

3. Naming conventions
- Collections: lowercase, plural (e.g., `orders`, `rewardTransactions`).
- Document IDs: semantic IDs where natural (e.g., `users/{uid}`), otherwise ULIDs.
- Fields: camelCase; status enums with constrained values; timestamps as `createdAt`/`updatedAt` (`serverTimestamp`).
- Ownership: `ownerId` (user uid) on all user-owned docs.

4. Timestamp standardization
- Ensure `createdAt` and `updatedAt` exist across all write paths; add `lastReadAt` only in analytics collections.

5. Backward-compatible schema adapters
- Reader adapters: support old and new field names (e.g., resolve `customer.email` or `customerEmail`).
- Writer adapters: dual-write to old and new fields during migration window with a global toggle.
- Add `schemaVersion` field to migrated documents.

## Phase 2: Index Management
1. Query inventory and index planning
- Extract frequent query shapes from services (orders by `userId+createdAt`, rewards by `userId+dateKey`, offers by `active+startsAt`).
- Validate against existing `firestore.indexes.json`; remove unused, add missing.

2. Composite index additions
- Orders: `(userId ASC, createdAt DESC)` [exists], `(status ASC, createdAt DESC)` [exists]; add `(restaurantId ASC, createdAt DESC)` if filtering by location.
- Users: `(role ASC, createdAt DESC)` [exists]; add `(email ASC, disabled ASC)` if used by admin dashboards.
- Rewards/spins: ensure `(userId ASC, dateKey ASC)` [exists]; add `(userId ASC, expiredAt ASC)` for expiry views if used in `rewardsService.ts`.
- Offers/menuDrops: `(active ASC, startsAt DESC)` [exists]; add `(category ASC, active ASC)` if category filtering is common.

3. Documentation of indexes
- Per index: query example, collection, fields, sort order, owning feature.
- Store alongside codebase as developer docs and link from PRs.

4. Deployment and verification
- Update `firestore.indexes.json`; dry-run with emulator; deploy; verify query latencies.

## Phase 3: Security Rules Update
1. Role model and ownership
- Roles via custom claims: `admin`, `staff`, `user` from `auth` (align with `src/app/api/auth/roles/route.ts`).
- Helper functions: `isSignedIn()`, `isAdmin()`, `isStaff()`, `isOwner(ownerId)`, `hasOnly(keys)`, `validStatus(value)`.

2. Granular rules per collection
- `match /users/{uid}`: read/write if `request.auth.uid == uid || isAdmin()`; validate allowed fields and types.
- `match /orders/{id}`: read if `isOwner(resource.data.ownerId) || isAdmin()`; create by signed-in users with owned `ownerId`; updates restricted to mutable fields; deletes admin-only.
- Rewards subcollections: user read their own; writes server-side only (admin/Admin SDK) with immutability on history.
- Operational collections (`idempotencyKeys`, analytics): deny all to clients; allow only Admin SDK (rely on server-side usage).

3. Validation rules
- Enforce field sets with `request.resource.data.keys().hasOnly([...])` and required keys.
- Type checks with `is` operator (e.g., `request.resource.data.amount is int`).
- Value constraints (enum membership, positive numbers, timestamp ordering).

4. Test matrix
- Role-based scenarios: anonymous, user, staff, admin; owner vs non-owner; invalid shapes.
- Emulator tests for allow/deny and data validation.

## Phase 4: Admin Data Separation
1. Create a dedicated Firestore database `admin`
- Create `admin` database under the same project; manage with Firebase CLI or gcloud.
- Access from Admin SDK using named database (e.g., `getFirestore('admin')`).
- References: Firebase docs on multiple databases and SDK support.

2. Data boundaries
- Move admin-only data: `adminLogs`, `idempotencyKeys`, rule audit snapshots, performance metrics, system health.
- Client SDK never initializes or reads the `admin` database.

3. Access control
- Security rules for `admin` database: deny-all for client contexts; Admin SDK bypasses rules by design; enforce service account access via IAM.
- Keep `public (default)` database rules focused on user-facing collections.

4. Backward compatibility and dual-write
- During migration window, dual-write admin entries to both default and admin DB; read primarily from default until toggled.
- Decommission dual-write post verification.

## Phase 5: Implementation Requirements
1. Backward compatibility
- Feature flag `FIRESTORE_SCHEMA_MIGRATION=on/off` controlling dual-write and reader adapters.
- Migration scripts under `scripts/` to transform legacy fields safely with batch writes.

2. Documentation
- Developer guides for structural changes, naming conventions, rules, and indexes.
- Changelogs linked to affected features (orders, rewards, offers).

3. Benchmarks
- Pre/post latency sampling around hot queries; store results in `performance_metrics`.
- Aggregate median/95th percentile; include emulator vs production notes.

4. Monitoring
- Integrate Cloud Monitoring dashboards for Firestore metrics per database.
- Log client rule denials and query performance anomalies in `system_health`.

## Phase 6: Testing
1. Query compatibility
- Run existing flows against emulator with adapters enabled; ensure all reads/writes succeed.
- Spot-check complex filters with and without new indexes.

2. Security rules
- Automated tests across roles and edge cases using the emulator.
- Negative tests: attempts to write immutable fields, invalid types, cross-tenant reads.

3. Admin isolation
- Verify client contexts cannot access `admin` database; confirm server can with service account.

4. Load testing
- Concurrent reads on hot queries (orders by user, rewards history) with baseline vs optimized schema.
- Capture improvements and report deltas.

## Deliverables
- Updated `firestore.rules` (public DB) and rules for `admin` DB.
- Updated `firestore.indexes.json` with documented composite indexes.
- Migration adapters in services; one-off scripts for data transformation.
- Benchmarks and monitoring dashboards.
- Emulator test suite for rules and query compatibility; load-test harness.

## Timeline & Rollout
- Week 1: Audit + plan; define adapters and flags; index plan.
- Week 2: Implement cleanup adapters; add timestamps; update indexes; emulator verification.
- Week 3: Rules hardening; admin DB creation; dual-write; testing.
- Week 4: Benchmarks; remove dual-write; documentation; production rollout.

## References
- Firebase: Manage multiple Firestore databases — https://firebase.google.com/docs/firestore/manage-databases
- Google Cloud Blog: Multiple Firestore databases — https://cloud.google.com/blog/products/databases/manage-multiple-firestore-databases-in-a-project
- Admin SDK (JS) named DB usage discussion — https://stackoverflow.com/questions/77061688/how-can-i-connect-to-a-non-default-firestore-database-using-node-using-multiple