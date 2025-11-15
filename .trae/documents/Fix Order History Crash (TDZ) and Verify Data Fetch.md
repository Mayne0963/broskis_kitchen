## Diagnosis
- The error “Cannot access uninitialized variable” matches a Temporal Dead Zone (TDZ) we already saw: `sendChatMessage` in `OrderTracking.tsx` includes `generateSupportResponse` in its dependency array before `generateSupportResponse` is declared. This triggers a ReferenceError in React’s hook evaluation.
- As long as this TDZ exists, the Order History page can crash before the orders query even runs, appearing as if it “isn’t searching for orders”.

## Changes to Implement
1) Reorder hooks in `src/components/orders/OrderTracking.tsx`:
   - Move the `generateSupportResponse` function above `sendChatMessage`, or wrap it in `useRef`, so no hook references a not‑yet‑initialized `const`.
   - Review all other hooks for similar dependency issues; ensure no dependency references a `const` declared later.
2) Confirm `OrderProvider` auto load and page mounting (already enabled):
   - Keep `OrderProvider autoLoad=true` and unconditional rendering of `OrderTracking` so fetching begins immediately.
3) Verify API fallback remains intact:
   - `/api/my-orders` accepts `Authorization: Bearer <ID token>` when the cookie is missing.
   - `OrderContext` attaches the ID token to the request.
   - Listener falls back to API on `permission-denied` and `failed-precondition`.

## Testing & Verification
- Unit: Render `OrderTracking` with minimal props; ensure no ReferenceError when mounting.
- Integration: Confirm orders load on `/account/orders` without crashing.
- Firebase checks: Verify session cookie presence and composite index `(userId, createdAt desc)` on production; confirm rules allow reads for `resource.data.userId == uid`.
- Cross‑browser: Smoke test on Chrome/Safari to ensure no TDZ/runtime errors.

## Rollout
- Implement TDZ fix and run tests.
- Push changes and verify on your environment.

If you approve, I will fix the TDZ in `OrderTracking.tsx`, re‑run tests, and verify the order history page loads orders without crashing, plus double‑check Firebase.