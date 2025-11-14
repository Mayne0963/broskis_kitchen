## Overview
Implement resilient client-side order persistence with sessionStorage for the current, in-progress order and localStorage for a timestamped snapshot that can be resumed across refreshes, with validation, expiry, and a UX prompt.

## Data Model & Storage Keys
- OrderPayload: `{ items: CartItem[], subtotal: number, tax: number, total: number, updatedAt: string }`
- `sessionStorage` key: `bk_current_order`
- `localStorage` key: `bk_order_snapshot` → `{ order: OrderPayload, savedAt: string }`
- TTL: 24 hours for snapshots; expired snapshots are auto-cleared.

## Lifecycle & Behaviors
1. On add/update/remove/clear in cart:
   - Serialize `OrderPayload` safely and save to `bk_current_order` in `sessionStorage`.
   - When first item is added, create `bk_order_snapshot` with `savedAt`.
2. On page load (cart or any order-related view):
   - Attempt load from `bk_current_order` (session). If valid, hydrate cart and continue.
   - If session is empty, check `bk_order_snapshot` (local):
     - If valid and not expired, show a resume modal with item count and total.
     - “Yes” → hydrate cart and write to `sessionStorage`.
     - “No” → clear `bk_order_snapshot`.
3. On successful checkout (order completed/confirmed page):
   - Clear `bk_current_order` and `bk_order_snapshot`, and clear cart items.

## Validation & Error Handling
- Safe JSON parse with try/catch; schema validation:
  - `items` is array; each item has `id`, `name` (string), `price` (number ≥ 0), `quantity` (int ≥ 1); customizations normalized to arrays.
  - Recompute totals client-side; drop/repair invalid items.
- Storage feature detection; guard against Safari private mode and quota errors (try/catch + fallbacks).
- Expiry: if `savedAt` older than 24h, auto-clear before prompting.

## UX Prompt
- Modal using existing UI primitives (`Dialog` or `AlertDialog`).
- Content: “Continue previous order?” + summary (items count, total, last updated).
- Actions:
  - Yes: restore → set `bk_current_order` and cart state, show toast.
  - No: clear snapshot, show toast.
- Non-dismissable by backdrop to ensure clear choice.

## Technical Implementation Steps
1. Create utility `src/lib/utils/orderPersistence.ts` (pure client):
   - `saveSessionOrder(order: OrderPayload)`
   - `loadSessionOrder(): OrderPayload | null`
   - `saveLocalSnapshot(order: OrderPayload)`
   - `loadLocalSnapshot(): { order: OrderPayload, savedAt: string } | null`
   - `clearSessionOrder()`, `clearLocalSnapshot()`
   - `isExpired(savedAt: string, ttlMs = 24*60*60*1000)`
   - Safe parse/serialize helpers and validation function.
2. Wire persistence in `src/lib/context/CartContext.tsx`:
   - On mount: try `loadSessionOrder()`; if valid, `setItems(order.items)`.
   - In `addItem`, `updateQuantity`, `removeItem`, and `clearCart`:
     - After state update, compute fresh `OrderPayload` and call `saveSessionOrder()`.
     - When transitioning from 0 → 1 items, also call `saveLocalSnapshot()`.
3. Add resume modal hook `src/hooks/useOrderResumePrompt.ts`:
   - On mount: if session empty and local snapshot present/not expired, expose `promptData` and handlers.
   - Provide `useOrderResumePrompt()` returning `{ shouldPrompt, summary, accept(), decline() }`.
4. Integrate modal in `src/app/cart/page.tsx` (CartContent):
   - Use `Dialog`/`AlertDialog` to render prompt based on the hook.
   - Show item count and total; wire Yes/No actions.
5. Clear storage on completion:
   - In `src/components/checkout/OrderConfirmation.tsx` (or the final success component): call `clearSessionOrder()` + `clearLocalSnapshot()` and `clearCart()`.
   - Add a safety clear when receiving Stripe success return params.

## Compatibility & Testing
- Works in modern browsers (Chrome, Safari, Firefox, Edge). Guards for storage availability/errors.
- Add unit tests for validation and expiry in the utility.
- Manual tests:
  - Start order → refresh → auto-restore from session.
  - Close tab → reopen → modal appears if within 24h.
  - Decline resume clears snapshot.
  - Complete order → both storages cleared.

## Deliverables
- Utility `orderPersistence.ts` with typed validation and safe storage.
- CartContext integration to save/load session and snapshot.
- Resume modal hook and UI in cart page.
- Completion clear in order confirmation component.
- Documentation comments inline for maintainers.

## Next Steps
- Confirm this plan. Upon approval, I will implement utilities, wire the context and cart page, and add the success clear behavior. I’ll validate with local tests and ensure no regressions in existing cart behavior.