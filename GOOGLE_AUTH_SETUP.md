# Google OAuth Setup for Broski's Kitchen

This document explains how to configure Google OAuth authentication for the Broski's Kitchen application.

## What's Been Implemented

✅ **Google Auth Provider Configuration**
- Added Google Auth Provider to Firebase configuration
- Configured with `prompt: 'select_account'` for better UX

✅ **Authentication Context Updates**
- Added `signInWithGoogle()` method to AuthContext
- Handles user creation for new Google users
- Manages session cookies and error handling
- Added proper TypeScript types

✅ **UI Components**
- Created reusable `GoogleSignInButton` component
- Added Google sign-in buttons to login and signup pages
- Includes proper loading states and Google branding
- Added visual dividers with "Or continue with" text

✅ **Error Handling**
- Handles popup blocked scenarios
- Manages cancelled sign-ins
- Network error handling
- Rate limiting protection

## Firebase Console Setup Required

To enable Google OAuth, you need to configure it in your Firebase Console:

### 1. Enable Google Sign-In
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable**
6. Add your project's authorized domains:
   - `localhost` (for development)
   - Your production domain
7. Click **Save**

### 2. Configure OAuth Consent Screen (Google Cloud Console)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Fill in required information:
   - App name: "Broski's Kitchen"
   - User support email
   - Developer contact information
5. Add authorized domains if needed
6. Save and continue

### 3. OAuth 2.0 Client IDs (Automatic)
Firebase automatically creates the necessary OAuth 2.0 client IDs when you enable Google sign-in.

## Testing the Implementation

### Development Testing
1. Ensure your Firebase project is properly configured
2. Start the development server: `npm run dev`
3. Navigate to `/auth/login` or `/auth/signup`
4. Click "Sign in with Google" or "Sign up with Google"
5. Complete the Google OAuth flow

### What Happens During Sign-In
1. User clicks Google sign-in button
2. Google OAuth popup opens
3. User selects/authenticates with Google account
4. App receives user data from Google
5. If new user: Creates Firestore user document
6. Creates session cookie for authentication
7. Redirects to dashboard

## File Changes Made

### Core Authentication
- `src/lib/services/firebase.ts` - Added Google Auth Provider
- `src/lib/context/AuthContext.tsx` - Added `signInWithGoogle` method
- `src/types/index.ts` - Updated AuthContextType interface

### UI Components
- `src/components/auth/GoogleSignInButton.tsx` - New reusable component
- `src/app/auth/login/page.tsx` - Added Google sign-in option
- `src/app/auth/signup/page.tsx` - Added Google sign-up option

## Security Considerations

✅ **Popup Management**: Handles blocked popups gracefully
✅ **Session Management**: Creates secure session cookies
✅ **User Data**: Safely stores user data in Firestore
✅ **Error Handling**: Comprehensive error handling for all scenarios
✅ **Type Safety**: Full TypeScript support

## Troubleshooting

### Common Issues

**"Google sign-in not available"**
- Check Firebase configuration in environment variables
- Ensure Google provider is enabled in Firebase Console

**"Pop-up was blocked"**
- User needs to allow popups for your domain
- Consider implementing redirect-based flow as fallback

**"Network error"**
- Check internet connection
- Verify Firebase project configuration

**"Too many requests"**
- Rate limiting triggered, user should wait before retrying

### Development Tips

1. **Test with multiple Google accounts** to ensure proper user creation
2. **Check browser console** for detailed error messages
3. **Verify Firestore rules** allow user document creation
4. **Test popup blockers** in different browsers

## Next Steps

Optional enhancements you might consider:

1. **Redirect-based OAuth** as fallback for popup-blocked scenarios
2. **Account linking** for users with existing email/password accounts
3. **Additional providers** (Facebook, Apple, etc.)
4. **Profile management** for Google-authenticated users
5. **Admin panel** for managing OAuth users

The Google OAuth implementation is now complete and ready for use!