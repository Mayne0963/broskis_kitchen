## Observed Errors (from screenshot)
- Global fallback message appears: "Something went wrong. Please refresh the page." This is rendered by the error boundary component in src/components/common/ResourceErrorBoundary.tsx:54.
- Console shows a repeated TypeError: "null is not an object (evaluating 'o.value[0].href')". While this exact string isn’t in the repo, it likely comes from a client component manipulating DOM anchors/links or preload tags, assuming nodes exist.
- Numerous music/audio debug logs are present (from GlobalAudioProvider), indicating the page reached client hydration but a client-side exception triggered the error boundary.

## Likely Root Cause
- A client-only utility component performs DOM queries and assumes results exist, leading to null dereference and an uncaught TypeError that trips ResourceErrorBoundary.
- Candidate files that access DOM anchors and link tags:
  - ImageOptimizationEnhancer: link preload management (src/components/performance/ImageOptimizationEnhancer.tsx:324–352)
  - SEOAudit: queries anchors, canonical link, structured data scripts (src/components/seo/SEOAudit.tsx:169–176, 237–245)
  - SchemaGenerator: manipulates schema <script> tags (src/components/seo/SchemaGenerator.tsx:303–353)
  - Accessibility components: query focusable elements (src/components/accessibility/AccessibilityEnhancer.tsx:229–236)
- The error boundary that shows the black screen: src/components/common/ResourceErrorBoundary.tsx:50–56

## Fix Plan
### 1) Harden DOM access across utilities
- Add null/length guards and optional chaining around all `document.querySelectorAll` results and DOM manipulations that read `.href`/attributes.
- Wrap DOM logic in try/catch blocks to prevent uncaught exceptions.
- Specific updates:
  - SEOAudit
    - Guard `links` iteration when `href` is missing; use optional chaining and early returns.
    - Guard canonical, OG tags when `document.head` unavailable.
  - ImageOptimizationEnhancer
    - Ensure `document.head` exists before `appendChild` and cleanup; guard `preloadLinks` iteration.
  - SchemaGenerator
    - Guard `document.head` for appending scripts; wrap removal in try/catch.
  - AccessibilityEnhancer
    - Guard `focusableElements` before indexing and reading attributes.

### 2) Defensive Error Handling
- ResourceErrorBoundary
  - Continue suppressing “Resource failed to load” messages.
  - Add classification for non-fatal DOM audit errors: survive by rendering children and logging (don’t switch to fallback on these).
- ErrorMonitor
  - Use safe conversion of `event.reason` to string (`String(event.reason)`) before constructing `Error`, and guard `logError` inputs to avoid secondary exceptions.

### 3) Admin Flow Check
- Confirm the admin pages are not impacted by these utilities.
- Ensure `/admin` routes still gate properly using `getSessionCookie` (src/lib/auth/session.ts:35–77) and admin claims.

### 4) Verification
- Reproduce the affected page locally; validate that:
  - The page renders without the black-screen fallback.
  - No console TypeError remains.
  - Music/audio still initializes; no autoplay exceptions beyond expected blocked logs.
- Test related features: navigation, SEO audit rendering, schema generation, accessibility menu.

### 5) Documentation
- Record: original TypeError and fallback trigger; list of updated files and guards added; expected behaviors.
- Edge cases to monitor: slow DOM availability on very early hydration; SSR/CSR mismatch; third-party extensions injecting malformed nodes.

## Implementation Outline
- Update the files mentioned above with null checks and try/catch wrappers.
- Adjust ResourceErrorBoundary to classify certain client DOM audit errors as non-fatal.
- Strengthen ErrorMonitor’s event handlers.
- Run TypeScript checks; fix any typing gaps introduced by optional chaining.
- Test on homepage and admin dashboard; check console clean.

## Expected Outcome
- No uncaught DOM exceptions; error boundary no longer shows black-screen fallback.
- Console free of TypeError; audio and other client utilities function normally.
- Admin page continues to work under the Firebase session cookie auth guard.

## References
- Error boundary fallback: src/components/common/ResourceErrorBoundary.tsx:54
- SEOAudit DOM usage: src/components/seo/SEOAudit.tsx:169–176, 237–245
- Image preload management: src/components/performance/ImageOptimizationEnhancer.tsx:324–352
- Schema script injection: src/components/seo/SchemaGenerator.tsx:303–353
- Accessibility focus management: src/components/accessibility/AccessibilityEnhancer.tsx:229–236
