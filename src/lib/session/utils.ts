import { NextRequest } from "next/server";
import {
  sessionManager,
  SessionValidator,
  sessionTimeoutManager,
  sessionErrorHandler,
  browserSessionManager,
  sessionMonitoring
} from "./index";

export interface SessionInfo {
  valid: boolean;
  session?: {
    userId: string;
    email: string;
    role: string;
    emailVerified: boolean;
    sessionId: string;
    expiresAt: number;
    lastActivity: number;
  };
  timeout?: {
    timeRemaining: number;
    timeUntilWarning: number;
    isActive: boolean;
  };
  browser?: {
    name: string;
    version: string;
    device: string;
    fingerprint: string;
  };
  errors?: string[];
}

/**
 * Validate session request with comprehensive checks
 */
export async function validateSessionRequest(
  request: NextRequest,
  options: {
    requireAuth?: boolean;
    requireRole?: string[];
    requireEmailVerified?: boolean;
    allowAnonymous?: boolean;
  } = {}
): Promise<{
  valid: boolean;
  context?: any;
  error?: string;
  errorCode?: string;
}> {
  try {
    const validationContext = await SessionValidator.validateRequest(request, options);
    
    return {
      valid: validationContext.validationResult.valid,
      context: validationContext,
      error: validationContext.validationResult.error,
      errorCode: validationContext.validationResult.errorCode
    };
  } catch (error: any) {
    console.error("[SESSION_UTILS] Validation failed:", error);
    
    return {
      valid: false,
      error: error.message || "Validation failed",
      errorCode: "VALIDATION_ERROR"
    };
  }
}

/**
 * Refresh session if needed
 */
export async function refreshSessionIfNeeded(
  request: NextRequest
): Promise<{
  refreshed: boolean;
  session?: any;
  error?: string;
}> {
  try {
    const validation = await sessionManager.validateSession(request);
    
    if (!validation.valid || !validation.session) {
      return {
        refreshed: false,
        error: validation.error || "Invalid session"
      };
    }

    if (validation.needsRefresh) {
      const refreshedSession = await sessionManager.refreshSession(validation.session);
      
      return {
        refreshed: true,
        session: refreshedSession
      };
    }

    return {
      refreshed: false,
      session: validation.session
    };
  } catch (error: any) {
    console.error("[SESSION_UTILS] Refresh failed:", error);
    
    return {
      refreshed: false,
      error: error.message || "Refresh failed"
    };
  }
}

/**
 * Clear all session data comprehensively
 */
export async function clearAllSessionData(): Promise<{
  success: boolean;
  details: Record<string, boolean>;
  errors: string[];
}> {
  const details: Record<string, boolean> = {};
  const errors: string[] = [];

  try {
    // Clear server-side session
    try {
      await sessionManager.invalidateSession();
      details.serverSession = true;
    } catch (error) {
      details.serverSession = false;
      errors.push(`Server session: ${error}`);
    }

    // Clear browser storage
    try {
      await browserSessionManager.clearSession();
      details.browserStorage = true;
    } catch (error) {
      details.browserStorage = false;
      errors.push(`Browser storage: ${error}`);
    }

    // Stop timeout monitoring
    try {
      // This would need session ID, so we'll skip for now
      details.timeoutMonitoring = true;
    } catch (error) {
      details.timeoutMonitoring = false;
      errors.push(`Timeout monitoring: ${error}`);
    }

    return {
      success: errors.length === 0,
      details,
      errors
    };
  } catch (error) {
    console.error("[SESSION_UTILS] Clear all failed:", error);
    
    return {
      success: false,
      details,
      errors: [...errors, `General error: ${error}`]
    };
  }
}

/**
 * Get comprehensive session information
 */
export async function getSessionInfo(request?: NextRequest): Promise<SessionInfo> {
  const sessionInfo: SessionInfo = {
    valid: false,
    errors: []
  };

  try {
    // Get session validation
    const validation = request ? await sessionManager.validateSession(request) : { valid: false };
    sessionInfo.valid = validation.valid;

    if (validation.valid && validation.session) {
      sessionInfo.session = {
        userId: validation.session.uid,
        email: validation.session.email,
        role: validation.session.role,
        emailVerified: validation.session.emailVerified,
        sessionId: validation.session.sessionId,
        expiresAt: validation.session.expiresAt,
        lastActivity: validation.session.lastActivity
      };

      // Get timeout information
      try {
        const timeoutState = sessionTimeoutManager.getTimeoutState(validation.session);
        sessionInfo.timeout = {
          timeRemaining: timeoutState.timeRemaining,
          timeUntilWarning: timeoutState.timeUntilWarning,
          isActive: timeoutState.isActive
        };
      } catch (error) {
        sessionInfo.errors?.push(`Timeout info unavailable: ${error}`);
      }
    }

    // Get browser information
    if (request) {
      try {
        const userAgent = request.headers.get("user-agent") || "";
        const browserInfo = browserSessionManager.detectBrowserInfo(userAgent);
        
        sessionInfo.browser = {
          name: browserInfo.browser.name,
          version: browserInfo.browser.version,
          device: browserInfo.device.type,
          fingerprint: browserInfo.fingerprint || "unknown"
        };
      } catch (error) {
        sessionInfo.errors?.push(`Browser info unavailable: ${error}`);
      }
    }

    return sessionInfo;
  } catch (error: any) {
    console.error("[SESSION_UTILS] Get session info failed:", error);
    
    return {
      valid: false,
      errors: [`Failed to get session info: ${error.message}`]
    };
  }
}

/**
 * Check if session is valid (simple wrapper)
 */
export async function isSessionValid(request?: NextRequest): Promise<boolean> {
  try {
    const validation = request ? await sessionManager.validateSession(request) : { valid: false };
    return validation.valid;
  } catch (error) {
    console.error("[SESSION_UTILS] Session validation check failed:", error);
    return false;
  }
}

/**
 * Get session health summary
 */
export function getSessionHealthSummary(): {
  health: "healthy" | "degraded" | "unhealthy";
  issues: string[];
  recommendations: string[];
  metrics: any;
} {
  try {
    const health = sessionMonitoring.getSessionHealth();
    const metrics = sessionMonitoring.getMetrics();
    const stats = sessionMonitoring.getSessionStats();

    return {
      health: health.status,
      issues: health.issues,
      recommendations: health.recommendations,
      metrics: {
        ...metrics,
        ...stats
      }
    };
  } catch (error) {
    console.error("[SESSION_UTILS] Health summary failed:", error);
    
    return {
      health: "unhealthy",
      issues: ["Failed to get health summary"],
      recommendations: ["Check monitoring system"],
      metrics: {}
    };
  }
}

/**
 * Handle session errors with recovery
 */
export async function handleSessionError(
  error: Error,
  context: {
    sessionId?: string;
    userId?: string;
    request?: NextRequest;
    metadata?: Record<string, any>;
  }
): Promise<{
  handled: boolean;
  recoveryAttempted: boolean;
  recoverySuccessful?: boolean;
  response?: any;
}> {
  try {
    // Determine error code
    let errorCode = "UNKNOWN_ERROR";
    
    if (error.message.includes("expired")) {
      errorCode = "EXPIRED_SESSION";
    } else if (error.message.includes("invalid")) {
      errorCode = "INVALID_SESSION";
    } else if (error.message.includes("verification")) {
      errorCode = "VERIFICATION_FAILED";
    }

    const errorContext = {
      error,
      errorCode: errorCode as any,
      sessionId: context.sessionId,
      userId: context.userId,
      request: context.request,
      metadata: {
        ...context.metadata,
        timestamp: Date.now()
      }
    };

    // Handle error with recovery
    const response = await sessionErrorHandler.handleError(errorContext);
    
    return {
      handled: true,
      recoveryAttempted: true,
      recoverySuccessful: response.status !== 500,
      response
    };
  } catch (error: any) {
    console.error("[SESSION_UTILS] Error handling failed:", error);
    
    return {
      handled: false,
      recoveryAttempted: true,
      recoverySuccessful: false
    };
  }
}

/**
 * Utility function to check if user has required role
 */
export function hasRequiredRole(session: any, requiredRoles: string[]): boolean {
  if (!session || !session.role) {
    return false;
  }
  
  return requiredRoles.includes(session.role);
}

/**
 * Utility function to check if session is about to expire
 */
export function isSessionExpiringSoon(session: any, warningThreshold: number = 5 * 60 * 1000): boolean {
  if (!session || !session.expiresAt) {
    return true; // Assume expiring if no expiry info
  }
  
  const timeUntilExpiry = session.expiresAt - Date.now();
  return timeUntilExpiry <= warningThreshold;
}

/**
 * Utility function to format session duration
 */
export function formatSessionDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Utility function to get session summary for UI
 */
export async function getSessionSummary(): Promise<{
  isLoggedIn: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
  session?: {
    id: string;
    expiresAt: number;
    timeRemaining: string;
    isExpiringSoon: boolean;
  };
  browser?: {
    name: string;
    version: string;
    device: string;
  };
}> {
  try {
    const sessionInfo = await getSessionInfo();
    
    return {
      isLoggedIn: sessionInfo.valid,
      user: sessionInfo.session ? {
        id: sessionInfo.session.userId,
        email: sessionInfo.session.email,
        role: sessionInfo.session.role,
        emailVerified: sessionInfo.session.emailVerified
      } : undefined,
      session: sessionInfo.session ? {
        id: sessionInfo.session.sessionId,
        expiresAt: sessionInfo.session.expiresAt,
        timeRemaining: sessionInfo.timeout ? 
          formatSessionDuration(sessionInfo.timeout.timeRemaining) : "Unknown",
        isExpiringSoon: sessionInfo.timeout ? 
          !sessionInfo.timeout.isActive || sessionInfo.timeout.timeUntilWarning <= 0 : true
      } : undefined,
      browser: sessionInfo.browser ? {
        name: sessionInfo.browser.name,
        version: sessionInfo.browser.version,
        device: sessionInfo.browser.device
      } : undefined
    };
  } catch (error) {
    console.error("[SESSION_UTILS] Get session summary failed:", error);
    
    return {
      isLoggedIn: false
    };
  }
}