# Fixes Log: Admin Auth, Firestore Rules, and CORS/Listeners

Date: 2025-11-11

## Summary
- Resolved admin authorization mismatch (user showing as customer, access denied).
- Fixed Firestore rules to allow authenticated reads and admin writes for `menuDrops` and `offers`.
- Standardized admin checks to prefer claims-first and handle both `role: 'admin'` and `admin: true`.
- Addressed listener errors by defining missing queries and guarding under polling mode.

## Original Errors
- Admin user received "Access Denied" on admin pages while Firestore doc had `ADMIN=true`, `admin=true`, `isAdmin=true`, `role="admin"`.
- CORS/network errors with Firestore streaming endpoints causing `onSnapshot` to fail.
- Firestore `permission-denied` when reading `menuDrops`/`offers`.
- Runtime errors from undefined `menuDropsQuery`/`rewardsQuery` in `useAdminData`.

## Root Causes
- Auth guard checked role before claims were loaded; fallback misclassified admins.
- Firestore security rules missing explicit allowances for `menuDrops` and `offers`.
- `useAdminData` had commented-out queries but still referenced them in `Promise.all` and listeners.

## Implemented Changes
1. Firestore Rules (`firestore.rules`)
   - Allow authenticated reads for `menuDrops` and `offers`.
   - Allow admin writes (create/update/delete) conditioned on custom claims.

2. Auth Context (`src/lib/context/AuthContext.tsx`)
   - Added `claimsLoaded` state and included in context value.
   - `isAdmin` now checks `claims.role === 'admin' || claims.admin === true`.
   - Set `claimsLoaded` false on logout; true after claims fetch.

3. Auth Guard (`src/components/auth/AuthGuard.tsx`)
   - Waits for `claimsLoaded` before enforcing role-based access.
   - Calls `refreshUserToken()` to rehydrate claims when not loaded.

4. Admin Data Hook (`src/hooks/useAdminData.ts`)
   - Defined `menuDropsQuery` using `COLLECTIONS.MENU_DROPS` and `orderBy('startTime','desc')`.
   - Added `rewardsQuery` for `userRedemptions` with ordering and limit.
   - Wrapped `onSnapshot` subscriptions in `if (!USE_POLLING)`; polling path fetches periodically.

## Verification
- Confirmed admin pages render without access errors for admin users.
- Verified `menuDrops` and `offers` read access for authenticated users.
- Observed `onSnapshot` listeners operate when polling disabled; polling works when enabled via `NEXT_PUBLIC_FIRESTORE_USE_POLLING=true`.

## Follow-ups
- Consider adding unit tests for `AuthGuard` claims loading behavior.
- Review Content Security Policy `connect-src` for Firestore endpoints.
- Audit consistency of admin fields in user docs; prefer `role: 'admin'` and custom claim `admin: true`.