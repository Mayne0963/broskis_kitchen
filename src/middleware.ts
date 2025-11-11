import { NextResponse, type NextRequest } from "next/server";
import { createCombinedSessionMiddleware } from "@/lib/session/middleware";
import { withMonitoring } from "@/lib/session/sessionMonitoring";

// Configure session middleware with comprehensive settings
const sessionMiddleware = createCombinedSessionMiddleware({
  validation: {
    enabled: true,
    requireAuth: false, // Will be determined per route
    requireEmailVerification: false,
    allowedRoles: [],
    refreshOnValidation: true,
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
  },
  timeout: {
    enabled: true,
    idleTimeout: 30 * 60 * 1000, // 30 minutes
    absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours
    warningTime: 5 * 60 * 1000, // 5 minutes warning
    refreshOnActivity: true,
  },
  errorHandling: {
    enabled: true,
    enableRateLimiting: true,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    maxRetries: 3,
    enableLogging: true,
  },
  browser: {
    enabled: true,
    enableCors: true,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    enableStorageFallback: true,
  },
  monitoring: {
    enabled: true,
    trackMetrics: true,
    trackEvents: true,
    healthCheckInterval: 5 * 60 * 1000, // 5 minutes
  },
});

// Route-specific configurations
const routeConfigs = {
  // Public routes - no authentication required
  public: {
    paths: ["/", "/menu", "/about", "/contact", "/api/public"],
    config: { validation: { requireAuth: false } },
  },
  // Authentication routes
  auth: {
    paths: ["/auth/login", "/auth/signup", "/login", "/signup", "/api/auth"],
    config: { validation: { requireAuth: false } },
  },
  // Protected user routes
  protected: {
    paths: ["/dashboard", "/profile", "/orders", "/loyalty", "/rewards", "/cart", "/checkout"],
    config: { validation: { requireAuth: true, requireEmailVerification: true } },
  },
  // Admin routes
  admin: {
    paths: ["/admin"],
    config: { 
      validation: { 
        requireAuth: true, 
        requireEmailVerification: true, 
        allowedRoles: ["admin", "superadmin"] 
      } 
    },
  },
  // API routes
  api: {
    paths: ["/api"],
    config: { 
      validation: { requireAuth: false }, // Individual API endpoints handle auth
      errorHandling: { enableRateLimiting: true },
    },
  },
};

// Helper function to get route configuration
function getRouteConfig(pathname: string) {
  // Check for exact matches first
  for (const [category, config] of Object.entries(routeConfigs)) {
    if (config.paths.includes(pathname)) {
      return config.config;
    }
  }

  // Check for prefix matches
  for (const [category, config] of Object.entries(routeConfigs)) {
    if (config.paths.some(path => pathname.startsWith(path))) {
      return config.config;
    }
  }

  // Default configuration
  return { validation: { requireAuth: false } };
}

// Main middleware function with monitoring
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // Get route-specific configuration
  const routeConfig = getRouteConfig(pathname);
  
  // Apply session middleware with monitoring
  const monitoredMiddleware = withMonitoring(sessionMiddleware, {
    requestId: crypto.randomUUID(),
    userAgent: req.headers.get("user-agent") || "unknown",
    ip: req.ip || req.headers.get("x-forwarded-for") || "unknown",
    pathname,
  });

  try {
    // Execute session middleware with route configuration
    const response = await monitoredMiddleware(req, routeConfig);
    
    // Add security headers
    const secureResponse = NextResponse.next();
    
    // Copy headers from session middleware response
    response.headers.forEach((value, key) => {
      secureResponse.headers.set(key, value);
    });

    // Add additional security headers
    secureResponse.headers.set("X-Frame-Options", "DENY");
    secureResponse.headers.set("X-Content-Type-Options", "nosniff");
    secureResponse.headers.set("X-XSS-Protection", "1; mode=block");
    secureResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    
    return secureResponse;
  } catch (error) {
    console.error("Middleware error:", error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("RATE_LIMITED")) {
        return NextResponse.redirect(new URL("/429", req.url));
      }
      if (error.message.includes("SESSION_EXPIRED")) {
        return NextResponse.redirect(new URL("/auth/login?error=session_expired", req.url));
      }
      if (error.message.includes("INSUFFICIENT_ROLE")) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }
    
    // Generic error redirect
    return NextResponse.redirect(new URL("/500", req.url));
  }
}

export const config = {
  // Matcher configuration to exclude static assets
  matcher: [
    "/((?!_next|static|.*\\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp3|wav|ogg)$).*)",
  ],
};