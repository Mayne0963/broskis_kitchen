## Goals
- Ensure /account/orders renders reliably, with clear loading and error feedback
- Allow viewing orders without requiring email verification
- Eliminate race conditions between auth and order fetching
- Ensure middleware protects /account routes consistently

## Changes
### Page: src/app/account/orders/page.tsx
- Keep `dynamic: "force-dynamic"` to avoid prerendering issues
- Use `AuthGuard` with `requireAuth={true}` and `requireEmailVerification={false}` (already correct)
- Prevent double fetch by setting `<OrderProvider autoLoad={false}>` and use a guarded `useEffect` to call `refresh()` only when `user && !authLoading`
- Add an error banner when `useOrders().error` is present
- Keep friendly login prompt with button linking to `/auth/login?callbackUrl=/account/orders`
- Show spinners while `authLoading` and `ordersLoading` (already largely implemented)
- Handle empty orders gracefully with an empty state component/text

### Context: src/lib/context/OrderContext.tsx
- No functional changes required; fetches `/api/my-orders` correctly and exposes `loading`, `error`, `refresh`
- Optional: guard `autoLoad` to avoid duplicate fetch when the page also calls `refresh()` after auth completes

### Auth Guard: src/components/auth/AuthGuard.tsx
- No changes; current logic waits for `isLoading` before enforcing requirements and does not require email verification when flag is false

### Middleware: middleware.ts
- Confirm `/account` is in `PROTECTED_ROUTES` (currently present on lines 4-14)
- No changes necessary; it redirects unauthenticated users to `/auth/login` with `callbackUrl`

## Implementation Steps
1. Update `src/app/account/orders/page.tsx`:
   - Set `<OrderProvider autoLoad={false}>`
   - In `OrderHistoryPageContent`, add an error banner when `error` exists
   - If `orders.length === 0` and `!ordersLoading`, show an empty state message
2. Verify `middleware.ts` already protects `/account` (it does); no edits
3. Keep `requireEmailVerification={false}` in `AuthGuard`

## Verification
- Unauthenticated user → Middleware redirects to `/auth/login?callbackUrl=/account/orders`
- Authenticated, email-unverified → Page loads; no redirect; can view orders
- Authenticated, no orders → Empty state message shown
- Loading flows → Spinner during auth check; spinner during orders fetch
- Console → No hydration or race-condition errors; no 401s from `/api/my-orders`

## Rollback
- If any regression, revert page changes and restore `<OrderProvider autoLoad={true}>` while keeping the guarded `useEffect`.
