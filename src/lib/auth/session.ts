import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { DecodedIdToken } from "firebase-admin/auth";

export interface SessionUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: string;
  displayName?: string;
  customClaims?: Record<string, any>;
  lastSignIn?: string;
  sessionExpiry?: number;
}

export interface AuthGuardOptions {
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
  returnUrl?: string;
  skipRedirect?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: SessionUser;
  error?: string;
  errorCode?: string;
}

/**
 * Enhanced server-side session verification with comprehensive error handling
 */
export async function getSessionCookie(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
      console.log("[SESSION] No session cookie found");
      return null;
    }

    // Verify the session cookie using Firebase Admin with enhanced validation
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Additional validation checks
    if (!decodedToken.uid || !decodedToken.email) {
      console.error("[SESSION] Invalid token structure - missing required fields");
      return null;
    }

    // Check token expiration with buffer
    const now = Math.floor(Date.now() / 1000);
    const expirationBuffer = 300; // 5 minutes buffer
    
    if (decodedToken.exp && (decodedToken.exp - expirationBuffer) <= now) {
      console.log("[SESSION] Token expiring soon, requiring refresh");
      return null;
    }
    
    const user: SessionUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      // Prefer custom claim `admin` for authoritative role; fallback to `role` claim
      role: (decodedToken as any).admin === true ? "admin" : (decodedToken as any).role || "customer",
      displayName: decodedToken.name,
      customClaims: decodedToken,
      lastSignIn: decodedToken.auth_time ? new Date(decodedToken.auth_time * 1000).toISOString() : undefined,
      sessionExpiry: decodedToken.exp
    };

    console.log(`[SESSION] Valid session for user ${user.uid} (${user.email})`);
    return user;
  } catch (error: any) {
    // Enhanced error logging with specific error types
    if (error.code === 'auth/session-cookie-expired') {
      console.log("[SESSION] Session cookie expired");
    } else if (error.code === 'auth/session-cookie-revoked') {
      console.log("[SESSION] Session cookie revoked");
    } else if (error.code === 'auth/invalid-session-cookie') {
      console.log("[SESSION] Invalid session cookie format");
    } else {
      console.error("[SESSION] Session verification failed:", error.message || error);
    }
    
    
    return null;
  }
}

/**
 * Clear session cookie with proper security settings
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = cookies();
    cookieStore.set("__session", "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    console.log("[SESSION] Session cookie cleared");
  } catch (error) {
    console.error("[SESSION] Failed to clear session cookie:", error);
  }
}

/**
 * Enhanced authentication verification with detailed results
 */
export async function verifyAuthentication(options: AuthGuardOptions = {}): Promise<AuthResult> {
  try {
    const user = await getSessionCookie();
    
    if (!user) {
      return {
        success: false,
        error: "No valid session found",
        errorCode: "NO_SESSION"
      };
    }
    
    // Check email verification requirement
    if (options.requireEmailVerification && !user.emailVerified) {
      return {
        success: false,
        user,
        error: "Email verification required",
        errorCode: "EMAIL_NOT_VERIFIED"
      };
    }
    
    // Check role-based access
    if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
      return {
        success: false,
        user,
        error: `Access denied. Required roles: ${options.allowedRoles.join(", ")}`,
        errorCode: "INSUFFICIENT_PERMISSIONS"
      };
    }
    
    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error("[SESSION] Authentication verification failed:", error);
    return {
      success: false,
      error: "Authentication verification failed",
      errorCode: "VERIFICATION_ERROR"
    };
  }
}

/**
 * Enhanced authentication guard with comprehensive options and error handling
 */
export async function withAuthGuard<T>(
  handler: (user: SessionUser) => Promise<T>,
  options: AuthGuardOptions = {}
): Promise<T> {
  const authResult = await verifyAuthentication(options);
  
  if (!authResult.success) {
    if (options.skipRedirect) {
      throw new Error(authResult.error || "Authentication failed");
    }
    
    // Handle different error types with appropriate redirects
    switch (authResult.errorCode) {
      case "NO_SESSION":
        const loginUrl = new URL(options.redirectTo || "/auth/login", process.env.NEXT_PUBLIC_BASE_URL || "https://broskiskitchen.com");
        if (options.returnUrl) {
          loginUrl.searchParams.set("next", options.returnUrl);
        }
        loginUrl.searchParams.set("error", "authentication_required");
        redirect(loginUrl.toString());
        break;
        
      case "EMAIL_NOT_VERIFIED":
        const verifyUrl = new URL("/auth/verify-email", process.env.NEXT_PUBLIC_BASE_URL || "https://broskiskitchen.com");
        if (options.returnUrl) {
          verifyUrl.searchParams.set("next", options.returnUrl);
        }
        verifyUrl.searchParams.set("error", "email_verification_required");
        redirect(verifyUrl.toString());
        break;
        
      case "INSUFFICIENT_PERMISSIONS":
        redirect("/unauthorized");
        break;
        
      default:
        redirect(options.redirectTo || "/auth/login");
    }
  }
  
  return handler(authResult.user!);
}

/**
 * Require authentication - redirect if not authenticated
 */
export async function requireAuth(returnUrl?: string): Promise<SessionUser> {
  const authResult = await verifyAuthentication();
  
  if (!authResult.success) {
    const loginUrl = new URL("/auth/login", process.env.NEXT_PUBLIC_BASE_URL || "https://broskiskitchen.com");
    if (returnUrl) {
      loginUrl.searchParams.set("next", returnUrl);
    }
    loginUrl.searchParams.set("error", "authentication_required");
    redirect(loginUrl.toString());
  }
  
  return authResult.user!;
}

/**
 * Require email verification - redirect if not verified
 */
export async function requireEmailVerification(returnUrl?: string): Promise<SessionUser> {
  const authResult = await verifyAuthentication({ requireEmailVerification: true });
  
  if (!authResult.success) {
    if (authResult.errorCode === "EMAIL_NOT_VERIFIED") {
      const verifyUrl = new URL("/auth/verify-email", process.env.NEXT_PUBLIC_BASE_URL || "https://broskiskitchen.com");
      if (returnUrl) {
        verifyUrl.searchParams.set("next", returnUrl);
      }
      verifyUrl.searchParams.set("error", "email_verification_required");
      redirect(verifyUrl.toString());
    } else {
      const loginUrl = new URL("/auth/login", process.env.NEXT_PUBLIC_BASE_URL || "https://broskiskitchen.com");
      if (returnUrl) {
        loginUrl.searchParams.set("next", returnUrl);
      }
      loginUrl.searchParams.set("error", "authentication_required");
      redirect(loginUrl.toString());
    }
  }
  
  return authResult.user!;
}

/**
 * Require specific role - redirect if unauthorized
 */
export async function requireRole(allowedRoles: string[], returnUrl?: string): Promise<SessionUser> {
  const authResult = await verifyAuthentication({ 
    requireEmailVerification: true, 
    allowedRoles 
  });
  
  if (!authResult.success) {
    switch (authResult.errorCode) {
      case "NO_SESSION":
        const loginUrl = new URL("/auth/login", process.env.NEXT_PUBLIC_BASE_URL || "https://broskiskitchen.com");
        if (returnUrl) {
          loginUrl.searchParams.set("next", returnUrl);
        }
        loginUrl.searchParams.set("error", "authentication_required");
        redirect(loginUrl.toString());
        break;
        
      case "EMAIL_NOT_VERIFIED":
        const verifyUrl = new URL("/auth/verify-email", process.env.NEXT_PUBLIC_BASE_URL || "https://broskiskitchen.com");
        if (returnUrl) {
          verifyUrl.searchParams.set("next", returnUrl);
        }
        verifyUrl.searchParams.set("error", "email_verification_required");
        redirect(verifyUrl.toString());
        break;
        
      case "INSUFFICIENT_PERMISSIONS":
        redirect("/unauthorized");
        break;
        
      default:
        redirect("/auth/login");
    }
  }
  
  return authResult.user!;
}

/**
 * Check auth status without redirecting - enhanced with detailed information
 */
export async function checkAuthStatus(): Promise<{
  isAuthenticated: boolean;
  user: SessionUser | null;
  error?: string;
  errorCode?: string;
  needsEmailVerification?: boolean;
  sessionExpiry?: number;
}> {
  const authResult = await verifyAuthentication({ skipRedirect: true });
  
  return {
    isAuthenticated: authResult.success,
    user: authResult.user || null,
    error: authResult.error,
    errorCode: authResult.errorCode,
    needsEmailVerification: authResult.user ? !authResult.user.emailVerified : false,
    sessionExpiry: authResult.user?.sessionExpiry
  };
}

/**
 * Refresh session if needed (for client-side use via API)
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const user = await getSessionCookie();
    
    if (!user || !user.sessionExpiry) {
      return false;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const refreshThreshold = 1800; // 30 minutes before expiry
    
    if ((user.sessionExpiry - refreshThreshold) <= now) {
      console.log("[SESSION] Session needs refresh");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[SESSION] Failed to check session refresh status:", error);
    return true; // Assume refresh needed on error
  }
}

/**
 * Get session metadata for monitoring and analytics
 */
export async function getSessionMetadata(): Promise<{
  hasSession: boolean;
  sessionAge?: number;
  timeUntilExpiry?: number;
  userAgent?: string;
  lastActivity?: string;
} | null> {
  try {
    const user = await getSessionCookie();
    
    if (!user) {
      return { hasSession: false };
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    return {
      hasSession: true,
      sessionAge: user.lastSignIn ? now - Math.floor(new Date(user.lastSignIn).getTime() / 1000) : undefined,
      timeUntilExpiry: user.sessionExpiry ? user.sessionExpiry - now : undefined,
      lastActivity: user.lastSignIn
    };
  } catch (error) {
    console.error("[SESSION] Failed to get session metadata:", error);
    return null;
  }
}
