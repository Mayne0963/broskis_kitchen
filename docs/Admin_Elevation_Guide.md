# Admin Elevation Guide

This guide documents how to securely elevate a user's privileges to admin in Firebase Authentication and Firestore, including Cloud Function, Firestore rules, client integration, error handling, and testing.

## Overview

- Cloud Function `elevateUserToAdmin` verifies the caller is admin, validates the target UID, sets custom claims `{ admin: true, role: 'admin' }`, and writes an audit log to `adminLogs`.
- Firestore rules check `request.auth.token.admin == true` or `role == "admin"` to gate admin-only collections.
- Client code calls the callable function and refreshes token to reflect updated claims.

## Required Permissions

- Firebase Admin SDK service account with `Editor` or `Firebase Admin` role to update custom claims and write Firestore logs.
- Cloud Functions: `httpsCallable` enabled; optional App Check enforced for callable function.
- Firestore: rules rely on custom claims; ensure authentication is enabled.

## Security Considerations

- Only admins can call the elevation function; function checks `context.auth.token.admin || role === 'admin'`.
- Input validation ensures `targetUid` is a string with sane length; existence verified via Admin SDK.
- Rate limiting: allows up to 5 requests per minute per requester to mitigate abuse.
- Audit logging: writes an immutable log entry with requester and target UID.
- App Check enforced at function level to mitigate automated abuse.

## Cloud Function

Callable function at `functions/src/admin/elevateUser.ts` exports `elevateUserToAdmin` and is included in `functions/src/index.ts`.

Deployment:

```bash
cd functions
npm run build
npm run deploy -- --only functions:elevateUserToAdmin
```

## Firestore Rules

- Updated helper `isAdmin()` now checks either `admin` claim or `role === "admin"`.
- `adminLogs` collection is restricted to admins.

File: `firestore.rules`.

## Client Integration

Utility: `src/lib/services/adminElevation.ts` provides `elevateUserToAdmin(targetUid)`:

- Calls callable function via `httpsCallable(functions, 'elevateUserToAdmin')`.
- On success, refreshes current user's ID token: `auth.currentUser.getIdToken(true)`.
- Maps common error codes to user-friendly messages.

Optional UI: `src/components/admin/ElevateUserForm.tsx` form to submit a target UID and show feedback.

## Error Handling

- Permission denied: throws `permission-denied` mapped to user message.
- Invalid inputs: `invalid-argument` with clear guidance.
- Unauthenticated: requires sign-in before use.
- Resource exhausted: rate limit backoff.
- Network/server errors: generic fallback message.

## Testing Procedures

1. Local emulation (optional):
   - `firebase emulators:start --only functions,firestore`
   - Ensure client points to emulator (`USE_FIREBASE_EMULATOR=true`).
2. Unit tests (functions):
   - Mock `context.auth` and data; assert claims updated and audit log written.
3. Integration tests (client):
   - Call elevation as admin; verify success message and token refresh.
4. Firestore rules testing:
   - Use Firebase emulator or CLI to assert admins can write/read `adminLogs`.
5. Manual checks:
   - In console, inspect user custom claims after elevation.
   - Sign out/in to ensure claims propagate to session.

## Rollback

To revoke admin:

```js
await admin.auth().setCustomUserClaims(targetUid, { admin: false, role: null });
```

Record the action in `adminLogs` similarly.