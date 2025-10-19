# Authentication System Documentation

## Overview

This document outlines the unified authentication system implemented to resolve the authentication mismatch that was preventing users from accessing protected routes like the dashboard and profile pages.

**Status: ✅ RESOLVED** - Authentication system has been successfully unified and tested.

## Problem Identified

The application had two conflicting authentication systems:
1. **NextAuth JWT validation** in middleware
2. **Firebase Auth validation** in dashboard and other protected pages

This mismatch caused users to be redirected to login even when they had valid sessions, creating a broken authentication flow.

## Solution Implemented

### Primary Authentication System: Firebase Auth

We chose Firebase Auth as the primary authentication system because:
- It was already integrated into most components
- Provides robust session management with Firebase session cookies
- Better suited for the application's architecture
- More consistent with the existing user management system

### Key Changes Made

#### 1. Session Management Unification

**Before:**
- Dashboard used `getServerUser()` from `@/lib/session` (Firebase ID token validation)
- Session creation used `session` cookie
- Middleware used NextAuth JWT validation

**After:**
- All components use `getSessionCookie()` from `@/lib/auth/session` (Firebase session cookie validation)
- Unified cookie name: `__session`
- Middleware uses Firebase session validation

#### 2. Files Updated

##### Core Authentication Files:
- `src/middleware.ts` - Updated to use Firebase session validation
- `src/app/api/session/route.ts` - Updated cookie name and validation method
- `src/lib/auth/session.ts` - Primary session validation function

##### Protected Pages:
- `src/app/dashboard/page.tsx` - Updated to use `getSessionCookie()`
- `src/app/profile/page.tsx` - Updated to use `getSessionCookie()`
- `src/app/account/profile/page.tsx` - Updated to use `getSessionCookie()`
- `src/app/account/orders/page.tsx` - Updated to use `getSessionCookie()`

#### 3. Session Cookie Implementation

The unified system uses Firebase session cookies with the following characteristics:

```typescript
// Cookie name: __session
// Validation method: adminAuth().verifySessionCookie()
// Returns: User object with uid, email, emailVerified, name, role, permissions
```

#### 4. Middleware Protection

The middleware now:
- Checks for `__session` cookie
- Validates Firebase session cookies
- Performs basic JWT structure validation
- Clears invalid/expired cookies automatically
- Redirects unauthenticated users to `/auth/login`

### Authentication Flow

1. **User Login:**
   - User authenticates through NextAuth providers
   - Firebase session cookie is created via `/api/session`
   - Cookie is set as `__session` with proper security flags

2. **Route Protection:**
   - Middleware intercepts requests to protected routes
   - Validates `__session` cookie using Firebase
   - Allows access if valid, redirects to login if invalid

3. **Page-Level Validation:**
   - Protected pages use `getSessionCookie()` for server-side validation
   - Consistent user object structure across all pages
   - Automatic redirect to login for invalid sessions

### Security Features

- **HttpOnly cookies** - Prevents XSS attacks
- **Secure flag** - HTTPS-only transmission
- **SameSite=Lax** - CSRF protection
- **Automatic cleanup** - Invalid cookies are cleared
- **JWT validation** - Basic structure and expiration checks

### Testing Results

✅ **Middleware Protection:** Correctly redirects unauthenticated users
✅ **Session Validation:** Firebase session cookies work properly
✅ **Protected Routes:** Dashboard and profile pages accessible with valid sessions
✅ **Public Routes:** Unprotected routes remain accessible
✅ **Cookie Management:** Proper cookie creation and cleanup

### Best Practices Implemented

1. **Consistent Session Validation:** All components use the same validation method
2. **Secure Cookie Handling:** Proper security flags and cleanup
3. **Error Handling:** Graceful handling of invalid/expired sessions
4. **Performance:** Efficient middleware processing with early returns
5. **Maintainability:** Centralized authentication logic

### Future Considerations

1. **API Route Updates:** Some API routes still use the old `getServerUser()` function and should be updated when needed
2. **Session Refresh:** Consider implementing automatic session refresh for better UX
3. **Role-Based Access:** The current system supports roles and permissions for future RBAC implementation

### Troubleshooting

**Common Issues:**
- **Redirect loops:** Check that middleware excludes auth routes
- **Session not found:** Verify cookie name consistency (`__session`)
- **Invalid sessions:** Check Firebase configuration and cookie security settings

**Debug Tools:**
- Check browser developer tools for cookie presence
- Monitor server logs for middleware processing
- Use `/api/auth/session` endpoint to verify session status

## Conclusion

The unified Firebase authentication system provides a robust, secure, and consistent authentication flow throughout the application. Users can now successfully authenticate and access protected routes without encountering authentication mismatches.