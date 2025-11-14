## Root Cause
- `useOrderResumePrompt()` is called outside of any component at the end of `src/app/cart/page.tsx:339`, violating the Rules of Hooks. This triggers React error #321 and the global error fallback.
- The values `shouldPrompt`, `summary`, `accept`, `decline` are referenced inside `CartContent` but the hook is not called within the component body.

## Changes
- Move `const { shouldPrompt, summary, accept, decline } = useOrderResumePrompt()` into `CartContent()` at the top, after other hooks, before any early returns.
- Ensure the prompt UI renders only after hook call and not conditionally before hooks.
- Add a lightweight unit test to assert the cart page renders without invalid hook errors.

## Verification
- Run unit test for cart content render.
- Manually navigate to `/cart` locally and confirm no "Invalid hook call" and no global fallback.

## Effects
- Eliminates React error #321 on the cart page.
- No behavior change beyond correctly mounting the resume prompt.

I’ll implement the fix in `src/app/cart/page.tsx`, add a small test, and verify.