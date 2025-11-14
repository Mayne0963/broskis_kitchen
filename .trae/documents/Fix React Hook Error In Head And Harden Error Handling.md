## Findings
- Error boundary renders "Something went wrong. Please refresh the page" from `src/components/common/ResourceErrorBoundary.tsx`, applied globally in `src/app/layout.tsx`.
- Console shows:
  - Unhandled Promise Rejection: `TypeError: null is not an object (evaluating 'R.H.useState')`
  - Minified React error `#418` with `HTML` arg, consistent with using client hooks in a non-client/head context.
- `layout.tsx` includes client components inside `<head>`: `<StructuredData />` and `<OrganizationStructuredData />`, both marked `use client` and use hooks (`usePathname`). Client hooks are not supported in `<head>` and can trigger the exact React invariant seen.
- Global audio and auth logs are informational; `/data/tracks.json` returns 200; no failed network requests shown.

## Root Cause
Rendering client components that use React hooks inside `<head>` of `RootLayout` causes runtime hook invocation in a non-supported environment → React invariant (#418) and `R.H.useState` null dereference, tripping the global error boundary.

## Changes To Implement
### 1) Make structured data head-safe
- Replace `<StructuredData />` and `<OrganizationStructuredData />` usages in `<head>` of `src/app/layout.tsx` with a server-safe implementation:
  - Add `StructuredDataHead` (server component, no hooks) that returns static `<script type="application/ld+json">`.
  - Add `OrganizationStructuredDataHead` (server) likewise.
  - Keep dynamic client-only schema via existing `SchemaGenerator` under `<ClientOnly>` in body.
- Validation:
  - Ensure JSON-LD is deterministic and uses `process.env.NEXT_PUBLIC_SITE_URL`.

### 2) Improve user-facing error fallback
- Update `ResourceErrorBoundary` fallback to:
  - Display clear message, digest, and actions: Reload, Go Home, and Retry.
  - Keep benign filters but do not auto-clear for the head-hook error.
  - Log with `errorLogger` including component stack.

### 3) Harden logging and graceful recovery
- `ErrorMonitor`: add context tags for hydration/head violations; ensure unhandled rejections include stack.
- Add retry/backoff for chunk loading via `setupChunkErrorHandler` (already present); extend logging to include route and browser info.

### 4) Validate inputs and API responses
- `src/app/api/auth/roles/route.ts`: add schema validation (zod) for `uid`, `role`, respond with 400/403/500 and descriptive messages; include `requestId` for traceability.
- `GlobalAudioProvider`: keep existing array guard; add type guard for track shape; log and skip invalid entries.

### 5) Tests
- Unit: render `StructuredDataHead` and verify script tag and valid JSON-LD.
- Unit: `ResourceErrorBoundary` renders enhanced fallback when given the head-hook error.
- E2E (Playwright):
  - Home page loads without the global fallback text.
  - Navigate to a few routes; verify no `#418`/`useState` errors captured; assert UI remains functional.

## Rollout & Verification
- Build locally and run `vitest` + Playwright to verify.
- Check browser console: no `#418` error, no `R.H.useState` null deref.
- Confirm structured data present either in head (static) or added by `SchemaGenerator` client-side.

## Documentation
- Document the head-safe JSON-LD approach, error boundary UX, logging enhancements, validation, and tests in the PR description. Provide troubleshooting notes for React head/client-hook misuse.

Please confirm and I’ll apply the edits, add tests, and verify end-to-end.