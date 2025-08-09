# Authentication System Setup Guide

This guide explains how to set up and use the Firebase authentication system implemented in Broski's Kitchen.

## Overview

The authentication system uses Firebase Authentication with server-side session management for secure user authentication. It includes:

- User registration and login
- Email verification
- Password reset
- Session-based authentication with cookies
- Route protection middleware
- Server-side authentication verification

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore Database
3. Configure authentication providers (Email/Password)
4. Get your Firebase configuration from Project Settings

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

Required Firebase environment variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PROJECT_ID`
- `NEXTAUTH_SECRET`

### 3. Firebase Admin SDK Setup

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the `private_key`, `client_email`, and `project_id` values
5. Add them to your `.env.local` file

**Important**: The `FIREBASE_PRIVATE_KEY` should include the full key with newlines escaped:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## File Structure

### Authentication Components
- `/src/app/auth/login/page.tsx` - Login page
- `/src/app/auth/signup/page.tsx` - Registration page
- `/src/app/auth/forgot-password/page.tsx` - Password reset page
- `/src/app/auth/verify-email/page.tsx` - Email verification page

### API Routes
- `/src/app/api/auth/session-login/route.ts` - Creates session cookie after login
- `/src/app/api/auth/session-logout/route.ts` - Clears session cookie on logout

### Authentication Logic
- `/src/lib/context/AuthContext.tsx` - Authentication context provider
- `/src/lib/auth/session.ts` - Server-side session utilities
- `/src/middleware.ts` - Route protection middleware

## How It Works

### Client-Side Authentication Flow

1. **Registration**: User signs up with email/password
2. **Email Verification**: User must verify their email before accessing protected routes
3. **Login**: After verification, user can log in
4. **Session Creation**: On successful login, a session cookie is created
5. **Route Access**: User can access protected routes with valid session

### Server-Side Session Management

1. **Session Cookie**: Created using Firebase Admin SDK after successful login
2. **Middleware Protection**: Routes are protected using Next.js middleware
3. **Session Verification**: Server-side utilities verify session cookies
4. **Automatic Cleanup**: Sessions are cleared on logout

### Route Protection

The middleware automatically handles:
- Redirecting unauthenticated users from protected routes to login
- Redirecting authenticated users from auth pages to dashboard
- Checking email verification status

#### Protected Routes
- `/profile/*`
- `/orders/*`
- `/loyalty/*`
- `/rewards/*`
- `/cart/*`
- `/checkout/*`

#### Public-Only Routes (redirect if authenticated)
- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`

## Usage Examples

### Using the Auth Context

```tsx
import { useAuth } from '@/lib/context/AuthContext'

function MyComponent() {
  const { user, loading, login, logout, signup } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>

  return (
    <div>
      <p>Welcome, {user.displayName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Server-Side Authentication

```tsx
import { requireAuth } from '@/lib/auth/session'

export default async function ProtectedPage() {
  const user = await requireAuth()
  
  return (
    <div>
      <h1>Protected Content</h1>
      <p>User ID: {user.uid}</p>
    </div>
  )
}
```

### API Route Protection

```tsx
import { getSessionCookie } from '@/lib/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const user = await getSessionCookie(request)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Handle authenticated request
  return NextResponse.json({ data: 'Protected data' })
}
```

## Security Features

- **Session Cookies**: Secure, HTTP-only cookies for session management
- **Email Verification**: Required before accessing protected routes
- **Server-Side Validation**: All authentication checks happen server-side
- **Automatic Cleanup**: Sessions are properly cleared on logout
- **Route Protection**: Middleware prevents unauthorized access

## Troubleshooting

### Common Issues

1. **"Firebase Admin SDK not initialized"**
   - Check that all Firebase environment variables are set correctly
   - Ensure `FIREBASE_PRIVATE_KEY` includes proper newline escaping

2. **"Session cookie verification failed"**
   - Verify that the Firebase project ID matches in all configurations
   - Check that the service account has proper permissions

3. **Redirect loops**
   - Ensure middleware configuration matches your route structure
   - Check that protected/public route arrays are correctly defined

### Debug Mode

To enable debug logging, add to your `.env.local`:
```
NODE_ENV=development
```

## Next Steps

1. Customize the authentication UI to match your brand
2. Add additional authentication providers (Google, GitHub, etc.)
3. Implement role-based access control
4. Add two-factor authentication
5. Set up email templates in Firebase Console

## Support

For issues or questions about the authentication system, please refer to:
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
