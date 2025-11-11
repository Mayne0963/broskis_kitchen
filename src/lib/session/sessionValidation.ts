import { NextRequest, NextResponse } from "next/server";
import { sessionManager, SessionValidationResult, SessionData } from "./sessionManager";
import { getToken } from "next-auth/jwt";
import { adminAuth } from "@/lib/firebase/admin";

export interface ValidationOptions {
  requireAuth?: boolean;
  requireRole?: string[];
  requireEmailVerified?: boolean;
  allowAnonymous?: boolean;
  redirectTo?: string;
}

export interface ValidationContext {
  session?: SessionData;
  nextAuthToken?: any;
  firebaseToken?: DecodedIdToken;
  validationResult: SessionValidationResult;
}

/**
 * Enhanced session validation middleware
 */
export class SessionValidator {
  /**
   * Validate session from request
   */
  static async validateRequest(
    request: NextRequest,
    options: ValidationOptions = {}
  ): Promise<ValidationContext> {
    const {
      requireAuth = false,
      requireRole = [],
      requireEmailVerified = false,
      allowAnonymous = false,
      redirectTo = "/login"
    } = options;

    try {
      // Validate primary session
      const sessionResult = await sessionManager.validateSession(request);
      
      // Check NextAuth token as backup
      const nextAuthToken = await getToken({ 
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET
      });

      // Check Firebase session cookie
      const firebaseCookie = request.cookies.get("__session")?.value;
      let firebaseToken: DecodedIdToken | undefined;
      
      if (firebaseCookie) {
        try {
          firebaseToken = await adminAuth.verifySessionCookie(firebaseCookie, true);
        } catch (error) {
          console.warn("[SESSION] Firebase token verification failed:", error);
        }
      }

      const context: ValidationContext = {
        session: sessionResult.session,
        nextAuthToken,
        firebaseToken,
        validationResult: sessionResult
      };

      // Handle anonymous access
      if (allowAnonymous && !sessionResult.valid) {
        return context;
      }

      // Handle authentication requirements
      if (requireAuth && !sessionResult.valid) {
        return this.createErrorContext(sessionResult);
      }

      // Handle role requirements
      if (requireRole.length > 0 && sessionResult.session) {
        const hasRequiredRole = requireRole.includes(sessionResult.session.role);
        if (!hasRequiredRole) {
          return {
            ...context,
            validationResult: {
              valid: false,
              error: "Insufficient permissions",
              errorCode: "INSUFFICIENT_PERMISSIONS"
            }
          };
        }
      }

      // Handle email verification requirement
      if (requireEmailVerified && sessionResult.session) {
        if (!sessionResult.session.emailVerified) {
          return {
            ...context,
            validationResult: {
              valid: false,
              error: "Email verification required",
              errorCode: "EMAIL_NOT_VERIFIED"
            }
          };
        }
      }

      // Handle session refresh if needed
      if (sessionResult.needsRefresh && sessionResult.session) {
        try {
          const refreshedSession = await sessionManager.refreshSession(sessionResult.session);
          context.session = refreshedSession;
          context.validationResult = {
            valid: true,
            session: refreshedSession
          };
        } catch (error) {
          console.warn("[SESSION] Failed to refresh session:", error);
        }
      }

      // Update activity timestamp
      if (sessionResult.session) {
        await sessionManager.updateActivity(sessionResult.session.sessionId);
      }

      return context;
    } catch (error) {
      console.error("[SESSION] Request validation failed:", error);
      return {
        validationResult: {
          valid: false,
          error: "Validation error",
          errorCode: "VALIDATION_ERROR"
        }
      };
    }
  }

  /**
   * Create error context
   */
  private static createErrorContext(result: SessionValidationResult): ValidationContext {
    return {
      validationResult: result
    };
  }

  /**
   * Create validation response
   */
  static createValidationResponse(
    context: ValidationContext,
    redirectTo?: string
  ): NextResponse {
    if (context.validationResult.valid) {
      return NextResponse.next();
    }

    // Handle redirect
    if (redirectTo) {
      const url = new URL(redirectTo, request.url);
      url.searchParams.set("error", context.validationResult.errorCode || "AUTH_REQUIRED");
      return NextResponse.redirect(url);
    }

    // Handle API response
    return NextResponse.json(
      {
        error: context.validationResult.error,
        errorCode: context.validationResult.errorCode,
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    );
  }

  /**
   * Validate session headers
   */
  static validateHeaders(request: NextRequest): boolean {
    const userAgent = request.headers.get("user-agent");
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    // Basic header validation
    if (!userAgent) {
      console.warn("[SESSION] Missing User-Agent header");
      return false;
    }

    // Check for suspicious patterns
    if (userAgent.includes("bot") || userAgent.includes("spider")) {
      console.warn("[SESSION] Suspicious User-Agent detected:", userAgent);
      return false;
    }

    // Validate origin if present
    if (origin) {
      const allowedOrigins = [
        process.env.NEXTAUTH_URL,
        process.env.NEXT_PUBLIC_SITE_URL,
        "http://localhost:3000"
      ].filter(Boolean);

      if (!allowedOrigins.some(allowed => origin.includes(allowed))) {
        console.warn("[SESSION] Invalid origin:", origin);
        return false;
      }
    }

    return true;
  }

  /**
   * Validate session consistency
   */
  static validateConsistency(context: ValidationContext): boolean {
    const { session, nextAuthToken, firebaseToken } = context;

    if (!session) return true; // No session to validate

    // Check NextAuth token consistency
    if (nextAuthToken) {
      if (nextAuthToken.email !== session.email) {
        console.warn("[SESSION] NextAuth email mismatch");
        return false;
      }
      if (nextAuthToken.role !== session.role) {
        console.warn("[SESSION] NextAuth role mismatch");
        return false;
      }
    }

    // Check Firebase token consistency
    if (firebaseToken) {
      if (firebaseToken.uid !== session.uid) {
        console.warn("[SESSION] Firebase UID mismatch");
        return false;
      }
      if (firebaseToken.email !== session.email) {
        console.warn("[SESSION] Firebase email mismatch");
        return false;
      }
    }

    return true;
  }

  /**
   * Log validation event
   */
  static logValidationEvent(
    event: string,
    context: ValidationContext,
    metadata?: Record<string, any>
  ): void {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      sessionId: context.session?.sessionId,
      userId: context.session?.uid,
      email: context.session?.email,
      role: context.session?.role,
      valid: context.validationResult.valid,
      errorCode: context.validationResult.errorCode,
      ...metadata
    };

    console.log(`[SESSION_VALIDATION] ${event}:`, JSON.stringify(logData));
  }
}

/**
 * Session validation middleware factory
 */
export function createSessionMiddleware(options: ValidationOptions = {}) {
  return async (request: NextRequest) => {
    try {
      // Validate headers first
      if (!SessionValidator.validateHeaders(request)) {
        return NextResponse.json(
          { error: "Invalid request headers", errorCode: "INVALID_HEADERS" },
          { status: 400 }
        );
      }

      // Validate session
      const context = await SessionValidator.validateRequest(request, options);
      
      // Validate consistency
      if (!SessionValidator.validateConsistency(context)) {
        return NextResponse.json(
          { error: "Session inconsistency detected", errorCode: "SESSION_INCONSISTENT" },
          { status: 401 }
        );
      }

      // Log validation event
      SessionValidator.logValidationEvent("session_validated", context, {
        path: request.nextUrl.pathname,
        method: request.method
      });

      // Add session data to request headers for downstream use
      const response = NextResponse.next();
      if (context.session) {
        response.headers.set("x-session-user-id", context.session.uid);
        response.headers.set("x-session-role", context.session.role);
        response.headers.set("x-session-valid", "true");
      }

      return response;
    } catch (error) {
      console.error("[SESSION] Middleware validation failed:", error);
      return NextResponse.json(
        { error: "Session validation error", errorCode: "VALIDATION_ERROR" },
        { status: 500 }
      );
    }
  };
}

// Export default middleware
export const sessionMiddleware = createSessionMiddleware();