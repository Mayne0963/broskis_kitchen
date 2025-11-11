# Authentication and Remote Config Test Plan

This document summarizes the unit tests added to prevent regressions in authentication, Remote Config, App Check, and role display, including the specific case of user `wT72f2LQxOV9wYwrnO5C9nyqPqFg2`.

## Scope
- Claims-first authorization logic with mixed admin scenarios
- Remote Config SDK integration and safe error handling
- App Check initialization and graceful failure
- ClientAuthGuard behavior with claims loading + refresh
- Profile page role display with different claim combinations

## Tests Added

1. `src/__tests__/auth/claims-first.test.tsx`
   - Refreshes when `allowedRoles` specified and claims missing
   - Grants access when `claims.admin=true` regardless of `user.role`
   - Grants access when `claims.role=admin`
   - Denies access when neither claims nor user indicate admin
   - Simulates legacy Firestore-only admin (no claims) and confirms claims-first denial

2. `src/__tests__/remote-config/remote-config.test.ts`
   - Initializes Remote Config when Firebase app exists
   - Returns `null` when no app (safe no-op)
   - Fetches and activates without throwing
   - Returns fallback value when RC unavailable
   - Returns typed value when RC available

3. `src/__tests__/app-check/app-check-init.test.ts`
   - Initializes App Check when site key present
   - Handles initialization exception without crashing

4. `src/__tests__/auth/client-auth-guard.claims-loading.test.tsx`
   - Calls `refreshUserToken` when `allowedRoles` set
   - Grants access after claims refresh sets `admin`

5. `src/__tests__/profile/profile-role-display.test.tsx`
   - Shows Admin badge and role when `user.role=admin`
   - Shows customer role when not admin

## Notable Case: wT72f2LQxOV9wYwrnO5C9nyqPqFg2
Historically, this user had admin flags in Firestore but not in Firebase custom claims, and UI showed `customer`. The new claims-first approach prioritizes `claims.admin===true` or `claims.role==='admin'`. Tests simulate the mismatch (Firestore admin with claims showing customer) to ensure the guard denies access until claims are updated.

## Running
- Unit tests: `pnpm test:run`
- UI mode: `pnpm test:ui`

## Future Work
- Add integration tests using emulators for end-to-end claim elevation
- Extend guards tests to include NextAuth session fallbacks