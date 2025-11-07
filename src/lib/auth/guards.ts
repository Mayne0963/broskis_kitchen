import { redirect } from "next/navigation";
import { 
  SessionUser, 
  AuthGuardOptions, 
  verifyAuthentication, 
  getSessionCookie,
  checkAuthStatus 
} from "./session";

export interface ServerGuardOptions extends AuthGuardOptions {
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
  returnUrl?: string;
  skipRedirect?: boolean;
  requirePermissions?: string[];
  customValidation?: (user: SessionUser) => boolean | Promise<boolean>;
}

export interface GuardResult<T = any> {
  success: boolean;
  data?: T;
  user?: SessionUser;
  error?: string;
  errorCode?: string;
  redirectUrl?: string;
}

/**
 * Enhanced server-side authentication guard with comprehensive validation
 */
export async function serverAuthGuard<T>(
  handler: (user: SessionUser) => Promise<T> | T,
  options: ServerGuardOptions = {}
): Promise<GuardResult<T>> {
  try {
    const authResult = await verifyAuthentication(options);
    
    if (!authResult.success) {
      const redirectUrl = buildRedirectUrl(authResult.errorCode, options);
      
      if (options.skipRedirect) {
        return {
          success: false,
          error: authResult.error,
          errorCode: authResult.errorCode,
          redirectUrl
        };
      }
      
      redirect(redirectUrl);
    }
    
    const user = authResult.user!;
    
    // Additional permission checks
    if (options.requirePermissions && options.requirePermissions.length > 0) {
      const hasPermissions = await checkUserPermissions(user, options.requirePermissions);
      if (!hasPermissions) {
        const error = `Missing required permissions: ${options.requirePermissions.join(", ")}`;
        
        if (options.skipRedirect) {
          return {
            success: false,
            error,
            errorCode: "INSUFFICIENT_PERMISSIONS",
            user
          };
        }
        
        redirect("/unauthorized");
      }
    }
    
    // Custom validation
    if (options.customValidation) {
      const isValid = await options.customValidation(user);
      if (!isValid) {
        const error = "Custom validation failed";
        
        if (options.skipRedirect) {
          return {
            success: false,
            error,
            errorCode: "CUSTOM_VALIDATION_FAILED",
            user
          };
        }
        
        redirect("/unauthorized");
      }
    }
    
    // Execute handler
    const result = await handler(user);
    
    return {
      success: true,
      data: result,
      user
    };
  } catch (error: any) {
    console.error("[SERVER_GUARD] Authentication guard failed:", error);
    
    if (options.skipRedirect) {
      return {
        success: false,
        error: "Authentication guard failed",
        errorCode: "GUARD_ERROR"
      };
    }
    
    // Re-throw redirect errors
    if (error.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    
    redirect(options.redirectTo || "/auth/login");
  }
}

/**
 * Page-level authentication guard for server components
 */
export async function pageAuthGuard(
  options: ServerGuardOptions = {}
): Promise<SessionUser> {
  const result = await serverAuthGuard(
    (user) => user,
    { ...options, skipRedirect: false }
  );
  
  return result.user!;
}

/**
 * API route authentication guard
 */
export async function apiAuthGuard(
  options: ServerGuardOptions = {}
): Promise<GuardResult<SessionUser>> {
  return serverAuthGuard(
    (user) => user,
    { ...options, skipRedirect: true }
  );
}

/**
 * Role-based access control guard
 */
export async function roleGuard(
  allowedRoles: string[],
  options: Omit<ServerGuardOptions, 'allowedRoles'> = {}
): Promise<SessionUser> {
  return pageAuthGuard({
    ...options,
    allowedRoles,
    requireEmailVerification: true
  });
}

/**
 * Admin-only access guard
 */
export async function adminGuard(
  options: Omit<ServerGuardOptions, 'allowedRoles'> = {}
): Promise<SessionUser> {
  return roleGuard(['admin', 'super_admin'], options);
}

/**
 * Customer access guard (authenticated users)
 */
export async function customerGuard(
  options: ServerGuardOptions = {}
): Promise<SessionUser> {
  return pageAuthGuard({
    ...options,
    requireEmailVerification: true
  });
}

/**
 * Guest access guard (unauthenticated users only)
 */
export async function guestGuard(
  options: Pick<ServerGuardOptions, 'redirectTo'> = {}
): Promise<void> {
  const authStatus = await checkAuthStatus();
  
  if (authStatus.isAuthenticated) {
    redirect(options.redirectTo || "/dashboard");
  }
}

/**
 * Optional authentication guard (works for both authenticated and unauthenticated)
 */
export async function optionalAuthGuard(): Promise<SessionUser | null> {
  try {
    const user = await getSessionCookie();
    return user;
  } catch (error) {
    console.log("[OPTIONAL_GUARD] No valid session found");
    return null;
  }
}

/**
 * Email verification guard
 */
export async function emailVerificationGuard(
  options: Omit<ServerGuardOptions, 'requireEmailVerification'> = {}
): Promise<SessionUser> {
  return pageAuthGuard({
    ...options,
    requireEmailVerification: true
  });
}

/**
 * Build redirect URL based on error code and options
 */
function buildRedirectUrl(
  errorCode?: string,
  options: ServerGuardOptions = {}
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://broskiskitchen.com";
  
  switch (errorCode) {
    case "NO_SESSION":
      const loginUrl = new URL(options.redirectTo || "/auth/login", baseUrl);
      if (options.returnUrl) {
        loginUrl.searchParams.set("next", options.returnUrl);
      }
      loginUrl.searchParams.set("error", "authentication_required");
      return loginUrl.toString();
      
    case "EMAIL_NOT_VERIFIED":
      const verifyUrl = new URL("/auth/verify-email", baseUrl);
      if (options.returnUrl) {
        verifyUrl.searchParams.set("next", options.returnUrl);
      }
      verifyUrl.searchParams.set("error", "email_verification_required");
      return verifyUrl.toString();
      
    case "INSUFFICIENT_PERMISSIONS":
      return new URL("/unauthorized", baseUrl).toString();
      
    default:
      return new URL(options.redirectTo || "/auth/login", baseUrl).toString();
  }
}

/**
 * Check if user has required permissions
 */
async function checkUserPermissions(
  user: SessionUser,
  requiredPermissions: string[]
): Promise<boolean> {
  try {
    // Check custom claims for permissions
    const userPermissions = user.customClaims?.permissions || [];
    
    // Admin and super_admin roles have all permissions
    if (['admin', 'super_admin'].includes(user.role)) {
      return true;
    }
    
    // Check if user has all required permissions
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  } catch (error) {
    console.error("[PERMISSIONS] Failed to check user permissions:", error);
    return false;
  }
}

/**
 * Higher-order component for page protection
 */
export function withPageAuth<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  options: ServerGuardOptions = {}
) {
  return async function AuthenticatedPage(props: T) {
    const user = await pageAuthGuard(options);
    
    return <Component {...props} user={user} />;
  };
}

/**
 * Utility to get current user in server components
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    return await getSessionCookie();
  } catch (error) {
    console.log("[GET_CURRENT_USER] No valid session found");
    return null;
  }
}

/**
 * Utility to require current user in server components
 */
export async function requireCurrentUser(
  returnUrl?: string
): Promise<SessionUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    const loginUrl = new URL("/auth/login", process.env.NEXT_PUBLIC_BASE_URL || "https://broskiskitchen.com");
    if (returnUrl) {
      loginUrl.searchParams.set("next", returnUrl);
    }
    loginUrl.searchParams.set("error", "authentication_required");
    redirect(loginUrl.toString());
  }
  
  return user;
}

/**
 * Check if current user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role || false;
}

/**
 * Check if current user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasAnyRole(['admin', 'super_admin']);
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Check if current user's email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.emailVerified || false;
}