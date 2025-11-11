import { NextRequest, NextResponse } from "next/server";
import { 
  sessionMiddleware as validationMiddleware,
  timeoutMiddleware,
  errorMiddleware,
  browserCompatibilityMiddleware,
  monitoringMiddleware
} from "./index";

export interface CombinedMiddlewareConfig {
  enableValidation: boolean;
  enableTimeout: boolean;
  enableErrorHandling: boolean;
  enableBrowserCompatibility: boolean;
  enableMonitoring: boolean;
  validationOptions?: {
    requireAuth?: boolean;
    requireRole?: string[];
    requireEmailVerified?: boolean;
    allowAnonymous?: boolean;
    redirectTo?: string;
  };
}

export const DEFAULT_COMBINED_CONFIG: CombinedMiddlewareConfig = {
  enableValidation: true,
  enableTimeout: true,
  enableErrorHandling: true,
  enableBrowserCompatibility: true,
  enableMonitoring: true
};

/**
 * Create combined session middleware with all features
 */
export function createCombinedSessionMiddleware(config: Partial<CombinedMiddlewareConfig> = {}) {
  const finalConfig = { ...DEFAULT_COMBINED_CONFIG, ...config };

  return async (request: NextRequest) => {
    let response = NextResponse.next();
    const executionContext = {
      requestId: generateRequestId(),
      startTime: Date.now(),
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      // 1. Browser Compatibility Check
      if (finalConfig.enableBrowserCompatibility) {
        try {
          const browserResponse = await browserCompatibilityMiddleware(request);
          response = mergeResponses(response, browserResponse);
        } catch (error) {
          executionContext.warnings.push(`Browser compatibility check failed: ${error}`);
          console.warn("[COMBINED_MIDDLEWARE] Browser compatibility check failed:", error);
        }
      }

      // 2. Session Monitoring
      if (finalConfig.enableMonitoring) {
        try {
          const monitoringResponse = await monitoringMiddleware(request);
          response = mergeResponses(response, monitoringResponse);
        } catch (error) {
          executionContext.warnings.push(`Monitoring failed: ${error}`);
          console.warn("[COMBINED_MIDDLEWARE] Monitoring failed:", error);
        }
      }

      // 3. Session Timeout Check
      if (finalConfig.enableTimeout) {
        try {
          const timeoutResponse = await timeoutMiddleware(request);
          if (timeoutResponse.status === 401) {
            // Session expired, return immediately
            return addExecutionHeaders(timeoutResponse, executionContext);
          }
          response = mergeResponses(response, timeoutResponse);
        } catch (error) {
          executionContext.warnings.push(`Timeout check failed: ${error}`);
          console.warn("[COMBINED_MIDDLEWARE] Timeout check failed:", error);
        }
      }

      // 4. Session Validation
      if (finalConfig.enableValidation) {
        try {
          const validationResponse = await validationMiddleware(request);
          if (validationResponse.status === 401) {
            // Validation failed, return immediately
            return addExecutionHeaders(validationResponse, executionContext);
          }
          response = mergeResponses(response, validationResponse);
        } catch (error) {
          executionContext.warnings.push(`Validation failed: ${error}`);
          console.warn("[COMBINED_MIDDLEWARE] Validation failed:", error);
        }
      }

      // 5. Error Handling (wraps everything)
      if (finalConfig.enableErrorHandling) {
        try {
          const errorResponse = await errorMiddleware(request);
          response = mergeResponses(response, errorResponse);
        } catch (error) {
          executionContext.errors.push(`Error handling failed: ${error}`);
          console.error("[COMBINED_MIDDLEWARE] Error handling failed:", error);
        }
      }

      // Add execution summary headers
      return addExecutionHeaders(response, executionContext);

    } catch (error) {
      // Critical error - return error response
      console.error("[COMBINED_MIDDLEWARE] Critical middleware error:", error);
      
      const errorResponse = NextResponse.json(
        {
          error: "Session middleware error",
          errorCode: "MIDDLEWARE_ERROR",
          requestId: executionContext.requestId,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );

      return addExecutionHeaders(errorResponse, executionContext);
    }
  };
}

/**
 * Create middleware for specific routes
 */
export function createRouteSpecificMiddleware(config: Partial<CombinedMiddlewareConfig> = {}) {
  const combinedMiddleware = createCombinedSessionMiddleware(config);

  return async (request: NextRequest) => {
    const url = request.nextUrl;
    const path = url.pathname;

    // Route-specific configurations
    const routeConfig = getRouteConfig(path, config);
    
    if (routeConfig) {
      const specificMiddleware = createCombinedSessionMiddleware(routeConfig);
      return specificMiddleware(request);
    }

    return combinedMiddleware(request);
  };
}

/**
 * Get route-specific configuration
 */
function getRouteConfig(path: string, baseConfig: Partial<CombinedMiddlewareConfig>): Partial<CombinedMiddlewareConfig> | null {
  // Public routes - minimal security
  if (path === "/" || path.startsWith("/public") || path.startsWith("/login") || path.startsWith("/register")) {
    return {
      ...baseConfig,
      enableValidation: false,
      enableTimeout: false,
      enableBrowserCompatibility: true,
      enableMonitoring: true,
      enableErrorHandling: true
    };
  }

  // Admin routes - maximum security
  if (path.startsWith("/admin")) {
    return {
      ...baseConfig,
      enableValidation: true,
      enableTimeout: true,
      enableErrorHandling: true,
      enableBrowserCompatibility: true,
      enableMonitoring: true,
      validationOptions: {
        requireAuth: true,
        requireRole: ["admin", "super_admin"],
        requireEmailVerified: true,
        redirectTo: "/admin/login"
      }
    };
  }

  // API routes - validation required
  if (path.startsWith("/api")) {
    return {
      ...baseConfig,
      enableValidation: true,
      enableTimeout: true,
      enableErrorHandling: true,
      enableBrowserCompatibility: false, // Skip browser checks for API
      enableMonitoring: true,
      validationOptions: {
        requireAuth: true,
        allowAnonymous: false
      }
    };
  }

  // Protected user routes
  if (path.startsWith("/dashboard") || path.startsWith("/profile") || path.startsWith("/orders")) {
    return {
      ...baseConfig,
      enableValidation: true,
      enableTimeout: true,
      enableErrorHandling: true,
      enableBrowserCompatibility: true,
      enableMonitoring: true,
      validationOptions: {
        requireAuth: true,
        requireEmailVerified: true,
        redirectTo: "/login"
      }
    };
  }

  return null; // Use default configuration
}

/**
 * Merge responses from multiple middleware
 */
function mergeResponses(base: NextResponse, additional: NextResponse): NextResponse {
  // Merge headers
  additional.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "content-type" || !base.headers.has(key)) {
      base.headers.set(key, value);
    }
  });

  // Use the most restrictive status code
  if (additional.status !== 200 && base.status === 200) {
    // Clone the additional response with base headers
    return new NextResponse(additional.body, {
      status: additional.status,
      headers: base.headers
    });
  }

  return base;
}

/**
 * Add execution summary headers
 */
function addExecutionHeaders(response: NextResponse, context: any): NextResponse {
  const executionTime = Date.now() - context.startTime;
  
  response.headers.set("x-middleware-execution-time", `${executionTime}ms`);
  response.headers.set("x-middleware-request-id", context.requestId);
  
  if (context.warnings.length > 0) {
    response.headers.set("x-middleware-warnings", context.warnings.join(", "));
  }
  
  if (context.errors.length > 0) {
    response.headers.set("x-middleware-errors", context.errors.join(", "));
  }

  return response;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create middleware for Next.js middleware.ts
 */
export function createNextMiddleware() {
  return createCombinedSessionMiddleware({
    enableValidation: true,
    enableTimeout: true,
    enableErrorHandling: true,
    enableBrowserCompatibility: true,
    enableMonitoring: true
  });
}

// Export default combined middleware
export const combinedSessionMiddleware = createCombinedSessionMiddleware();
export const nextSessionMiddleware = createNextMiddleware();