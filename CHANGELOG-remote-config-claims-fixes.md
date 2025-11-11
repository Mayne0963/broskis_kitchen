# Fixes: Remote Config, App Check, Admin Claims

## Original Errors/Issues
- CORS blocks on `firebaseremoteconfig.googleapis.com` due to direct REST calls.
- Missing App Check initialization causing service control failures.
- Admin users blocked despite Firestore flags; UI showing `customer` role.
- Inconsistent admin schema (`ADMIN`, `admin`, `isAdmin`, `role`).

## Implemented Solutions
- Added `src/lib/remoteConfig.ts` using Firebase Web SDK (`getRemoteConfig`, `fetchAndActivate`, `getValue`).
- Bootstrapped Remote Config in `src/components/system/RemoteConfigInit.tsx` and mounted in `app/layout.tsx`.
- Initialized App Check in `src/lib/firebase/client.ts` with `ReCaptchaV3Provider`, auto-refresh enabled.
- Standardized custom claims in `src/app/api/auth/roles/route.ts` to set `{ role, admin: role==='admin' }`.
- Enforced claims-first checks in `ClientAuthGuard` and profile UI to read `claims.admin`/`claims.role` before `user.role`.
- Updated CSP `connect-src` to include `https://firebaseremoteconfig.googleapis.com`.

## Verification Steps
1. Start dev: `pnpm dev` and open `http://localhost:3002`.
2. Confirm no Remote Config REST fetches; only SDK calls in network.
3. Ensure App Check token present in requests (check console/network headers).
4. Set role via API: `POST /api/auth/roles { uid, role: 'admin' }` and verify session reflects admin.
5. Check `/account/profile` and `/admin` gating uses claims-first and grants access correctly.

## Troubleshooting
- If Remote Config values do not load, verify Firebase client initialization is complete and site key `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` is set.
- If admin still shows as customer, refresh token (`AuthContext.refreshUserToken`) or reissue session cookie; ensure custom claims propagated and NextAuth role resolver aligns.
- For CORS issues, confirm CSP connect-src includes Remote Config domain and no direct fetch to REST is performed by app code or third-party.

## Follow-ups
- Add unit tests around claims refresh and RC activation.
- Audit any legacy direct fetches to Google APIs and replace with SDK usage.