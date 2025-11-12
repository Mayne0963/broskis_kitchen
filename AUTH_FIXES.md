# Authentication Error Resolution Summary

This change set resolves 401 errors and failed refreshes seen on the dashboard while authenticated. It normalizes session cookie handling, fixes the refresh endpoint, and adds a centralized client with retry logic.

## Symptoms Observed
- Multiple `401 Unauthorized` network errors on dashboard API calls.
- "Auth refresh service ... offline/failed" in console.
- Inconsistent UI auth state (login form visible while header shows a logged-in user).

## Root Causes
- Mixed cookie names: some routes used `session`/`bk_session`, others expected `__session`.
- Broken refresh implementation: attempted `createSessionCookie(customToken)` which is invalid; it must accept an ID token.
- Client fetch utilities did not include credentials consistently and suppressed non-OK statuses, masking failures.
- No centralized 401 handling; expired cookies caused immediate 401s across the app.

## Backend Fixes
- Normalize to `__session` for Firebase session cookie across auth routes and server utilities.
  - `src/app/api/auth/session-login/route.ts`: sets `__session` with `HttpOnly`, `Secure` (prod), `SameSite=lax`.
  - `src/app/api/auth/session-logout/route.ts` and `src/app/api/auth/logout/route.ts`: clear `__session`.
  - `src/lib/session.ts`: reads `__session` (fallback to `session`) and verifies via `adminAuth.verifySessionCookie`.
- Implement robust refresh endpoint that accepts `idToken` and issues a new session cookie:
  - `src/app/api/auth/refresh/route.ts`: if `idToken` provided → `verifyIdToken` → `createSessionCookie(idToken)` → set `__session`. Otherwise, it validates existing cookie and re-sets it to avoid hard failures; real rotation relies on an ID token.
- CORS credentials and header alignment:
  - `OPTIONS` handlers allow credentials and headers including `authorization` and `x-csrf-token`.

## Frontend Fixes
- Centralized API client with 401 refresh and retry:
  - `src/lib/utils/authFetch.ts`: includes credentials; on `401`, fetches fresh Firebase `idToken` where possible, calls `/api/auth/refresh`, then retries once.
- Stop suppressing error statuses:
  - `src/lib/utils/safeFetch.ts`: now returns actual `Response` and always includes credentials; network failures return a `status: 0` response.
- Normalize session cookie create/clear calls:
  - `src/lib/sessionClient.ts`: uses `/api/auth/session-login` and `/api/auth/session-logout` endpoints.
- Update context login/logout to use new endpoints and client:
  - `src/lib/context/AuthContext.tsx`: uses `authFetch` and new routes.
- Session expiry helpers:
  - `src/lib/session/exp.ts`: reads `__session` and background-calls `/api/auth/refresh`.

### Admin Status Alignment
- Client admin checks now rely on `user.role === 'admin'` or `user.admin === true`.
- Removed client env-based allowlist to avoid mismatches; server keeps allowlist fallback.
- Catering admin CTA uses the session role consistently with the server-rendered button in layout.

### Order History Stability
- OrderTracking guards Firestore usage when the client is not fully ready and falls back to `/api/my-orders` without throwing.
- Unauthorized or error responses render error UI instead of triggering the global error boundary.

## Security Improvements
- All auth cookies use `HttpOnly`, `Secure` in production, `SameSite=lax`, and `path=/`.
- CSRF support remains available via `lib/auth/security.ts` and `/api/auth/status` sets a token for authenticated users.
- Reduced leakage of auth state in client by not fabricating 200 responses.

## Reproduction & Validation
1. Sign in with a verified account.
2. Observe network calls to `/api/rewards/*` now succeed (no 401) when session is valid.
3. Force an expired session by waiting or editing cookie payload; trigger a data fetch.
4. The client sees `401`, calls `/api/auth/refresh` with an `idToken`, sets a fresh `__session`, and retries successfully.
5. Logout; confirm `__session` is cleared and protected routes return 401.

## No Regressions Checklist
- Admin endpoints that rely on `Authorization: Bearer` continue to work; `authFetch` does not add headers unless needed by the caller.
- Rewards endpoints use cookie-based auth via `getServerUser` and now accept `__session` consistently.
- CORS headers allow credentialed requests from the same origin.

## Follow-ups (Optional)
- Add an `AuthGate` wrapper for dashboard routes to ensure consistent UI state while token refresh is in progress.
- Enable structured request logging with correlation IDs for auth routes.
- Add integration tests that cover: login → cookie set, 401 → refresh → retry pass, logout → cookie cleared.

## Notes
- Firebase session cookie rotation requires an ID token. Background refresh without an ID token cannot issue a new cookie; the client’s 401 interceptor ensures a fresh ID token is used when necessary.
