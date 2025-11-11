import { NextRequest, NextResponse } from "next/server";
import { SessionErrorCode } from "./sessionManager";
import { adminAuth } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

export interface ErrorContext {
  error: Error;
  errorCode: SessionErrorCode;
  sessionId?: string;
  userId?: string;
  request?: NextRequest;
  metadata?: Record<string, any>;
}

export interface ErrorResponse {
  error: string;
  errorCode: SessionErrorCode;
  timestamp: string;
  requestId: string;
  details?: Record<string, any>;
  retryAfter?: number;
}

export interface RecoveryStrategy {
  type: "refresh" | "reauth" | "fallback" | "retry";
  priority: number;
  conditions: string[];
  action: (context: ErrorContext) => Promise<NextResponse | null>;
}

/**
 * Comprehensive session error handler with recovery strategies
 */
export class SessionErrorHandler {
  private static instance: SessionErrorHandler;
  private errorLog: Map<string, ErrorContext[]> = new Map();
  private recoveryStrategies: RecoveryStrategy[] = [];
  private readonly MAX_LOG_ENTRIES = 100;
  private readonly ERROR_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SessionErrorHandler {
    if (!SessionErrorHandler.instance) {
      SessionErrorHandler.instance = new SessionErrorHandler();
      SessionErrorHandler.instance.initializeRecoveryStrategies();
    }
    return SessionErrorHandler.instance;
  }

  /**
   * Initialize recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies = [
      {
        type: "refresh",
        priority: 1,
        conditions: ["EXPIRED_SESSION", "REFRESH_REQUIRED"],
        action: this.handleRefreshRecovery.bind(this)
      },
      {
        type: "reauth",
        priority: 2,
        conditions: ["NO_SESSION", "INVALID_SESSION", "REVOKED_SESSION"],
        action: this.handleReauthRecovery.bind(this)
      },
      {
        type: "fallback",
        priority: 3,
        conditions: ["VERIFICATION_FAILED", "MALFORMED_SESSION"],
        action: this.handleFallbackRecovery.bind(this)
      },
      {
        type: "retry",
        priority: 4,
        conditions: ["VALIDATION_ERROR"],
        action: this.handleRetryRecovery.bind(this)
      }
    ];
  }

  /**
   * Handle session error with recovery
   */
  async handleError(context: ErrorContext): Promise<NextResponse> {
    const { error, errorCode, sessionId, userId, request } = context;
    
    // Log the error
    this.logError(context);
    
    // Check for error rate limiting
    if (this.isRateLimited(sessionId || userId || "anonymous")) {
      return this.createRateLimitedResponse(context);
    }

    // Try recovery strategies
    const recoveryResponse = await this.tryRecovery(context);
    if (recoveryResponse) {
      return recoveryResponse;
    }

    // Create error response
    return this.createErrorResponse(context);
  }

  /**
   * Log error for analysis
   */
  private logError(context: ErrorContext): void {
    const { error, errorCode, sessionId, userId } = context;
    const key = sessionId || userId || "anonymous";
    
    if (!this.errorLog.has(key)) {
      this.errorLog.set(key, []);
    }
    
    const entries = this.errorLog.get(key)!;
    entries.push(context);
    
    // Keep only recent entries
    if (entries.length > this.MAX_LOG_ENTRIES) {
      entries.shift();
    }

    // Log to console with structured data
    console.error(`[SESSION_ERROR] ${errorCode}:`, {
      error: error.message,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      metadata: context.metadata
    });
  }

  /**
   * Check if user is rate limited
   */
  private isRateLimited(identifier: string): boolean {
    const entries = this.errorLog.get(identifier) || [];
    const recentEntries = entries.filter(entry => {
      const entryTime = new Date(entry.metadata?.timestamp || Date.now()).getTime();
      return Date.now() - entryTime < this.ERROR_WINDOW_MS;
    });
    
    return recentEntries.length > 5; // Max 5 errors per 5 minutes
  }

  /**
   * Try recovery strategies
   */
  private async tryRecovery(context: ErrorContext): Promise<NextResponse | null> {
    const strategies = this.recoveryStrategies
      .filter(strategy => strategy.conditions.includes(context.errorCode))
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of strategies) {
      try {
        const response = await strategy.action(context);
        if (response) {
          console.log(`[SESSION_RECOVERY] Applied ${strategy.type} strategy for ${context.errorCode}`);
          return response;
        }
      } catch (error) {
        console.error(`[SESSION_RECOVERY] Strategy ${strategy.type} failed:`, error);
      }
    }

    return null;
  }

  /**
   * Handle refresh recovery
   */
  private async handleRefreshRecovery(context: ErrorContext): Promise<NextResponse | null> {
    if (!context.request) return null;

    try {
      const sessionCookie = context.request.cookies.get("__session")?.value;
      if (!sessionCookie) return null;

      // Attempt to refresh the session
      const response = await fetch(new URL("/api/auth/session/refresh", context.request.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `__session=${sessionCookie}`
        }
      });

      if (response.ok) {
        const refreshedSession = await response.json();
        const nextResponse = NextResponse.next();
        
        // Copy new session cookie
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
          nextResponse.headers.set("set-cookie", setCookieHeader);
        }

        console.log(`[SESSION_RECOVERY] Successfully refreshed session for ${context.userId}`);
        return nextResponse;
      }
    } catch (error) {
      console.error("[SESSION_RECOVERY] Refresh failed:", error);
    }

    return null;
  }

  /**
   * Handle reauth recovery
   */
  private async handleReauthRecovery(context: ErrorContext): Promise<NextResponse | null> {
    if (!context.request) return null;

    const redirectUrl = new URL("/login", context.request.url);
    redirectUrl.searchParams.set("error", context.errorCode);
    redirectUrl.searchParams.set("returnTo", context.request.url);

    if (context.userId) {
      redirectUrl.searchParams.set("userId", context.userId);
    }

    console.log(`[SESSION_RECOVERY] Redirecting to login for ${context.userId}`);
    return NextResponse.redirect(redirectUrl);
  }

  /**
   * Handle fallback recovery
   */
  private async handleFallbackRecovery(context: ErrorContext): Promise<NextResponse | null> {
    if (!context.request) return null;

    try {
      // Try to validate with NextAuth token as fallback
      const nextAuthToken = await getToken({ 
        req: context.request as any,
        secret: process.env.NEXTAUTH_SECRET
      });

      if (nextAuthToken) {
        console.log(`[SESSION_RECOVERY] Fallback to NextAuth token for ${context.userId}`);
        return NextResponse.next();
      }
    } catch (error) {
      console.error("[SESSION_RECOVERY] Fallback validation failed:", error);
    }

    return null;
  }

  /**
   * Handle retry recovery
   */
  private async handleRetryRecovery(context: ErrorContext): Promise<NextResponse | null> {
    // Simple retry with delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try validation again
    try {
      if (context.request) {
        const validation = await sessionManager.validateSession(context.request);
        if (validation.valid) {
          console.log(`[SESSION_RECOVERY] Retry successful for ${context.userId}`);
          return NextResponse.next();
        }
      }
    } catch (error) {
      console.error("[SESSION_RECOVERY] Retry failed:", error);
    }

    return null;
  }

  /**
   * Create error response
   */
  private createErrorResponse(context: ErrorContext): NextResponse {
    const requestId = this.generateRequestId();
    const errorResponse: ErrorResponse = {
      error: this.getUserFriendlyError(context.errorCode),
      errorCode: context.errorCode,
      timestamp: new Date().toISOString(),
      requestId,
      details: this.getErrorDetails(context),
      retryAfter: this.getRetryAfter(context)
    };

    const statusCode = this.getStatusCode(context.errorCode);
    
    return NextResponse.json(errorResponse, { 
      status: statusCode,
      headers: {
        "x-request-id": requestId,
        "cache-control": "no-store, no-cache, must-revalidate"
      }
    });
  }

  /**
   * Create rate limited response
   */
  private createRateLimitedResponse(context: ErrorContext): NextResponse {
    const requestId = this.generateRequestId();
    
    return NextResponse.json(
      {
        error: "Too many authentication attempts",
        errorCode: "RATE_LIMITED",
        timestamp: new Date().toISOString(),
        requestId,
        retryAfter: 300 // 5 minutes
      },
      { 
        status: 429,
        headers: {
          "x-request-id": requestId,
          "retry-after": "300",
          "cache-control": "no-store, no-cache, must-revalidate"
        }
      }
    );
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyError(errorCode: SessionErrorCode): string {
    const errorMessages: Record<SessionErrorCode, string> = {
      NO_SESSION: "Please sign in to continue",
      INVALID_SESSION: "Your session is invalid. Please sign in again",
      EXPIRED_SESSION: "Your session has expired. Please sign in again",
      REVOKED_SESSION: "Your session has been revoked. Please sign in again",
      MALFORMED_SESSION: "Your session data is corrupted. Please sign in again",
      VERIFICATION_FAILED: "We couldn't verify your session. Please sign in again",
      REFRESH_REQUIRED: "Your session needs to be refreshed"
    };

    return errorMessages[errorCode] || "An authentication error occurred";
  }

  /**
   * Get HTTP status code
   */
  private getStatusCode(errorCode: SessionErrorCode): number {
    const statusCodes: Record<SessionErrorCode, number> = {
      NO_SESSION: 401,
      INVALID_SESSION: 401,
      EXPIRED_SESSION: 401,
      REVOKED_SESSION: 401,
      MALFORMED_SESSION: 400,
      VERIFICATION_FAILED: 401,
      REFRESH_REQUIRED: 401
    };

    return statusCodes[errorCode] || 500;
  }

  /**
   * Get error details
   */
  private getErrorDetails(context: ErrorContext): Record<string, any> {
    const details: Record<string, any> = {
      sessionId: context.sessionId,
      userId: context.userId,
      timestamp: new Date().toISOString()
    };

    if (context.metadata) {
      details.metadata = context.metadata;
    }

    if (process.env.NODE_ENV === "development") {
      details.stack = context.error.stack;
    }

    return details;
  }

  /**
   * Get retry after time
   */
  private getRetryAfter(context: ErrorContext): number | undefined {
    if (context.errorCode === "REFRESH_REQUIRED") {
      return 0; // Immediate retry
    }
    
    if (context.errorCode === "VERIFICATION_FAILED") {
      return 30; // 30 seconds
    }

    return undefined; // No automatic retry
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeWindow: number = 3600000): Record<string, number> {
    const stats: Record<string, number> = {};
    const cutoffTime = Date.now() - timeWindow;

    for (const entries of this.errorLog.values()) {
      for (const entry of entries) {
        const entryTime = new Date(entry.metadata?.timestamp || Date.now()).getTime();
        if (entryTime >= cutoffTime) {
          stats[entry.errorCode] = (stats[entry.errorCode] || 0) + 1;
        }
      }
    }

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog.clear();
    console.log("[SESSION_ERROR] Error log cleared");
  }
}

/**
 * Session error middleware
 */
export function createErrorMiddleware() {
  const errorHandler = SessionErrorHandler.getInstance();

  return async (request: NextRequest) => {
    try {
      // Let the request proceed normally
      return NextResponse.next();
    } catch (error: any) {
      // Handle any errors that occur during processing
      const errorContext: ErrorContext = {
        error,
        errorCode: "VALIDATION_ERROR",
        request,
        metadata: {
          url: request.url,
          method: request.method,
          timestamp: Date.now()
        }
      };

      return errorHandler.handleError(errorContext);
    }
  };
}

// Export singleton instance
export const sessionErrorHandler = SessionErrorHandler.getInstance();
export const errorMiddleware = createErrorMiddleware();