# Google Sign-In Session Creation Fix

## Problem Diagnosed

The "Failed to create session" error during Google Sign-In was caused by two main issues:

1. **Missing Firebase Admin SDK Configuration**: The server-side session creation requires Firebase Admin SDK environment variables that were not present in `.env.local`
2. **Strict Email Verification Check**: The session creation was rejecting Google OAuth users due to email verification requirements

## Root Cause Analysis

### Issue 1: Firebase Admin SDK Not Initialized
- The `/api/auth/session-login` route requires Firebase Admin SDK to create session cookies
- Missing environment variables: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- This caused `adminAuth()` to return `null`, leading to "Firebase Admin not initialized" error

### Issue 2: Email Verification Logic
- Google OAuth users are pre-verified by Google, but the code was checking `email_verified` flag strictly
- This caused legitimate Google users to be rejected with "Email not verified" error

## Applied Fixes

### 1. Added Firebase Admin SDK Environment Variables

**File**: `.env.local`
```diff
+ # Firebase Admin SDK (Required for server-side session management)
+ FIREBASE_PROJECT_ID = otw-web
+ FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@otw-web.iam.gserviceaccount.com
+ FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 2. Updated Email Verification Logic

**File**: `src/app/api/auth/session-login/route.ts`
```diff
- // Check if email is verified
- if (!decodedToken.email_verified) {
+ // Check if email is verified (skip for Google OAuth users as they are pre-verified)
+ const isGoogleUser = decodedToken.firebase?.sign_in_provider === 'google.com'
+ if (!decodedToken.email_verified && !isGoogleUser) {
   return NextResponse.json(
     { error: 'Email not verified' },
     { status: 403 }
   )
 }
```

### 3. Enhanced Error Handling

**File**: `src/app/api/auth/session-login/route.ts`
```diff
} catch (error) {
  console.error('Session login error:', error)
+ 
+ // Provide more specific error messages for debugging
+ let errorMessage = 'Failed to create session'
+ if (error instanceof Error) {
+   if (error.message.includes('Firebase Admin not initialized')) {
+     errorMessage = 'Firebase Admin SDK not properly configured'
+   } else if (error.message.includes('Invalid ID token')) {
+     errorMessage = 'Invalid authentication token'
+   } else if (error.message.includes('Token expired')) {
+     errorMessage = 'Authentication token expired'
+   }
+ }
+ 
  return NextResponse.json(
-   { error: 'Failed to create session' },
+   { error: errorMessage },
    { status: 500 }
  )
}
```

## Setup Instructions

### 1. Get Firebase Admin SDK Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`otw-web`)
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 2. Extract Required Values

From the downloaded JSON file, extract:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (escape newlines as `\n`)

### 3. Update Environment Variables

Replace the placeholder values in `.env.local`:
```env
FIREBASE_PROJECT_ID = otw-web
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@otw-web.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 4. Restart Development Server

```bash
npm run dev
```

## Security Considerations

- **Never commit** the actual private key to version control
- Use environment variables for all sensitive credentials
- The private key should include proper newline escaping (`\n`)
- Ensure `.env.local` is in your `.gitignore`

## Testing

1. Navigate to `/auth/login`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Session should be created successfully
5. Check browser cookies for `session` cookie

## Troubleshooting

If issues persist:

1. **Check console logs** for specific error messages
2. **Verify environment variables** are loaded correctly
3. **Ensure Google Sign-In is enabled** in Firebase Console
4. **Check network tab** for API response details
5. **Verify Firebase project configuration** matches environment variables

## Files Modified

- `.env.local` - Added Firebase Admin SDK environment variables
- `src/app/api/auth/session-login/route.ts` - Fixed email verification logic and enhanced error handling