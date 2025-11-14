## Findings
- Admin Catering page has SSR guard using `getServerSession(authOptions)` and redirects non-admins to `/auth/login?error=admin_required&next=/admin/catering`.
- Admin Catering API routes mostly use `ensureAdmin(request)` or session role fallback; however `src/app/api/admin/catering/export/route.ts` incorrectly calls `isAdmin(session?.user)` which expects a role string, causing false 403s for valid admins.
- Client admin visibility is split: `AdminCateringCTA` uses claims-first via `useAuth().isAdmin`, while `AdminButton` uses `useSession()` + `roles.isAdmin(role)`. Divergence can show the button when server access fails.
- Order History links point to `/account/orders`; alias page `src/app/account/orders/page.tsx` re-exports the Orders page. `OrderTracking` includes resilient error handling and API fallback.

## Plan
1. Correct Admin Export Route Guard
   - Update `src/app/api/admin/catering/export/route.ts` to verify admin correctly:
     - Prefer `await ensureAdmin(request)` as the primary guard.
     - If using `roles.isAdmin`, pass `(session?.user as any)?.role` instead of the whole user object.
   - Return `403` with a clear JSON error when unauthorized.

2. Standardize Admin Checks Across Catering APIs
   - Ensure `ensureAdmin(request)` is the first check in: `bulk/route.ts`, `[id]/route.ts`, `[id]/send-quote/route.ts`, `list/route.ts`, and `export/route.ts`.
   - Use NextAuth session role as a fallback only when `ensureAdmin` cannot determine.

3. Align Client Admin Button Visibility
   - Update `src/components/AdminButton.tsx` to leverage `useAuth()` claims-first logic (consistent with `AdminCateringCTA`).
   - Ensure both buttons hide during auth loading to prevent flicker.

4. Order History Redirect Verification
   - Audit components for any lingering `/orders` links and replace with `/account/orders` if found.
   - Keep `src/app/account/orders/page.tsx` as an alias re-export of `OrdersPage`.

5. Error Handling & User Feedback
   - For Admin page actions (e.g., export) that receive 401/403:
     - Surface a toast/snackbar: "Admin access required" and avoid crashing.
     - Optional: redirect to `/auth/login?error=admin_required&next=/admin/catering`.
   - Confirm `OrderTracking` continues to show local error UI on failures and not the global boundary.

6. Tests
   - Add unit/integration test for `GET /api/admin/catering/export` ensuring `ensureAdmin` is required and that admins succeed.
   - Add navigation test: non-admin to `/admin/catering` should redirect; admin should render.
   - Verify navbar/dashboard links route to `/account/orders` and page renders with `AuthGuard`.

## Verification
- Run dev server and manually test:
  - Admin user: navigate to `/admin/catering`; perform Export; confirm success.
  - Non-admin user: clicking Admin Catering redirects to login; no crash.
  - Order History: all entry points route to `/account/orders`; page loads or shows friendly auth prompt.
- Review network responses for 401/403 and UI feedback.

## Notes
- No database schema changes.
- Middleware role names may be harmonized to `admin`/`super_admin` for consistency; SSR/API guards remain authoritative. Would you like this adjustment included?