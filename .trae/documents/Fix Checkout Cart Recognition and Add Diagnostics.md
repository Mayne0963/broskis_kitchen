## Summary
Diagnose and fix the checkout flow so items are reliably recognized from the cart. Add robust server-side and client-side validation plus logging across the lifecycle.

## Findings
- Checkout and Cart pages post to `/api/checkout/session`, but no API route exists; this can lead to failures even with a non-empty cart.
- Cart items are provided by `CartContext` and persisted to localStorage/session, but checkout relies solely on context state at render time.

## Implementation Plan
### 1) Create Checkout Session API
- File: `src/app/api/checkout/session/route.ts`
- Behavior:
  - Parse `POST` body: `{ items: Array<{ name: string, price: number, qty: number }> }`.
  - Validate: items array exists, each item has `name` string, `price >= 0`, `qty >= 1`.
  - Log: input items, normalized items, computed total.
  - Create Stripe Checkout session with line items, success/cancel URLs.
  - Respond `{ url, sessionId }` on success; return `400` with details if items invalid; `500` with diagnostics on error.

### 2) Client-side Fallback for Items
- Introduce a small helper hook used by both `/cart` and `/checkout` pages:
  - If `useCart().items` is empty on mount, attempt to load `bk_current_order` from `sessionStorage` (via existing `orderPersistence` utility).
  - Merge results to produce `effectiveItems` for checkout payload mapping.
  - Log: raw context items, session fallback items, final payload sent to API.

### 3) Strengthen Cart → Payload Mapping
- Normalize mixed item shapes (supports `quantity`, `qty`, string prices).
- Add console logs in critical paths:
  - When adding items (`CartContext.addItem`): log item summary and cart count.
  - On checkout page before POST: log `payloadItems.length` and a redacted item summary.
  - On cart page’s `Proceed to Checkout`: log items count and computed totals.

### 4) Session/Cookie Considerations
- Ensure `safeFetch` sends `credentials: 'include'` (already implemented).
- Add server logging of request cookies and method to help diagnose session inconsistencies.

### 5) Tests & Scenarios
- Add a dev script or Playwright tests exercising:
  - Single item, multiple items, customized items.
  - Refresh before checkout (session fallback).
  - Direct navigation to checkout after add.
- Verify button states:
  - `/checkout` button disabled only when no items.
  - After fallback load, button shows “Proceed to Payment”.

### 6) Documentation
- Inline comments in the new API route and the checkout helper.
- Brief notes in `orderPersistence` describing usage in checkout.

## Deliverables
- `src/app/api/checkout/session/route.ts` with validation, Stripe session creation and detailed logging.
- Checkout hook to derive `effectiveItems` from CartContext or session fallback.
- Enhanced logging in CartContext and checkout triggers.
- Tests/script validating end-to-end recognition and session fallback.

## Rollout
- Implement the above, test locally with varied carts, and push.
- Monitor logs in production for the normalized input and session responses.

If you approve, I’ll implement the API route, the fallback hook, add logging, and verify across scenarios immediately.