import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSessionCookie } from './session';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = CSRF_TOKEN_LENGTH): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without crypto.getRandomValues
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(CSRF_TOKEN_LENGTH);
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(request: NextRequest): boolean {
  try {
    const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
    const tokenFromCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    
    if (!tokenFromHeader || !tokenFromCookie) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    return constantTimeCompare(tokenFromHeader, tokenFromCookie);
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Set CSRF token in response
 */
export function setCSRFToken(response: NextResponse): string {
  const token = generateCSRFToken();
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Needs to be accessible by client-side JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
  
  return token;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } => {
    const identifier = getClientIdentifier(request);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean up expired entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
    
    const current = rateLimitStore.get(identifier);
    
    if (!current || current.resetTime < now) {
      // First request or window expired
      const resetTime = now + config.windowMs;
      rateLimitStore.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime
      };
    }
    
    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }
    
    // Increment count
    current.count++;
    rateLimitStore.set(identifier, current);
    
    return {
      allowed: true,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime
    };
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session first
  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    try {
      // Extract user ID from session if available
      const payload = JSON.parse(atob(sessionCookie.split('.')[1]));
      if (payload.uid) {
        return `user:${payload.uid}`;
      }
    } catch {
      // Fall through to IP-based identification
    }
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return `ip:${ip}`;
}

/**
 * Security headers middleware
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    // Expanded connect-src to include site domains and Firebase endpoints
    "connect-src 'self' https://broskiskitchen.com https://brooksdb.com https://api.stripe.com https://firestore.googleapis.com https://securetoken.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com https://*.googleapis.com wss: https:; " +
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com;"
  );
  
  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return response;
}

/**
 * Session refresh mechanism
 */
export async function refreshSessionIfNeeded(request: NextRequest): Promise<{
  shouldRefresh: boolean;
  newToken?: string;
  error?: string;
}> {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return { shouldRefresh: false };
    }
    
    // Decode JWT to check expiration
    const parts = sessionCookie.split('.');
    if (parts.length !== 3) {
      return { shouldRefresh: false, error: 'Invalid session format' };
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    const iat = payload.iat;
    
    // Refresh if token expires within 15 minutes
    const refreshThreshold = 15 * 60; // 15 minutes
    const shouldRefresh = (exp - now) < refreshThreshold;
    
    if (shouldRefresh) {
      // Verify current session is still valid
      const sessionResult = await getSessionCookie(request);
      if (sessionResult.success && sessionResult.user) {
        // Generate new session token (this would typically involve calling Firebase Admin)
        // For now, we'll return a flag to indicate refresh is needed
        return { shouldRefresh: true };
      }
    }
    
    return { shouldRefresh: false };
  } catch (error) {
    console.error('Session refresh check error:', error);
    return { shouldRefresh: false, error: 'Session refresh check failed' };
  }
}

/**
 * Security event logging
 */
export interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'csrf_violation' | 'session_refresh' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: number;
}

export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now()
  };
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with security monitoring service (e.g., Sentry, DataDog)
    console.warn('Security Event:', securityEvent);
  } else {
    console.log('Security Event:', securityEvent);
  }
}

/**
 * Detect suspicious activity patterns
 */
export function detectSuspiciousActivity(request: NextRequest): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  // Check for common attack patterns
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  // Detect bot-like user agents
  const suspiciousUserAgents = [
    'curl', 'wget', 'python', 'bot', 'crawler', 'spider', 'scraper'
  ];
  
  if (suspiciousUserAgents.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  )) {
    reasons.push('Suspicious user agent');
  }
  
  // Check for missing or suspicious referer
  if (request.method === 'POST' && !referer) {
    reasons.push('Missing referer on POST request');
  }
  
  // Check for rapid requests (basic check)
  const identifier = getClientIdentifier(request);
  const recentRequests = rateLimitStore.get(identifier);
  if (recentRequests && recentRequests.count > 50) {
    reasons.push('High request frequency');
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons
  };
}

/**
 * Comprehensive security middleware
 */
export function securityMiddleware(request: NextRequest): {
  allowed: boolean;
  response?: NextResponse;
  csrfToken?: string;
} {
  // Rate limiting for auth endpoints
  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10 // 10 requests per 15 minutes for auth endpoints
  });
  
  // General rate limiting
  const generalRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  });
  
  const isAuthEndpoint = request.nextUrl.pathname.startsWith('/api/auth');
  const rateLimitResult = isAuthEndpoint ? 
    authRateLimit(request) : 
    generalRateLimit(request);
  
  if (!rateLimitResult.allowed) {
    const response = new NextResponse('Rate limit exceeded', { status: 429 });
    response.headers.set('Retry-After', Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
    
    logSecurityEvent({
      type: 'rate_limit',
      ip: getClientIdentifier(request),
      userAgent: request.headers.get('user-agent') || undefined,
      details: { endpoint: request.nextUrl.pathname }
    });
    
    return { allowed: false, response: setSecurityHeaders(response) };
  }
  
  // CSRF protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    if (!validateCSRFToken(request)) {
      const response = new NextResponse('CSRF token validation failed', { status: 403 });
      
      logSecurityEvent({
        type: 'csrf_violation',
        ip: getClientIdentifier(request),
        userAgent: request.headers.get('user-agent') || undefined,
        details: { endpoint: request.nextUrl.pathname, method: request.method }
      });
      
      return { allowed: false, response: setSecurityHeaders(response) };
    }
  }
  
  // Suspicious activity detection
  const suspiciousActivity = detectSuspiciousActivity(request);
  if (suspiciousActivity.suspicious) {
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: getClientIdentifier(request),
      userAgent: request.headers.get('user-agent') || undefined,
      details: { 
        reasons: suspiciousActivity.reasons,
        endpoint: request.nextUrl.pathname 
      }
    });
  }
  
  return { allowed: true };
}

/**
 * Client-side security utilities
 */
export const clientSecurity = {
  /**
   * Get CSRF token from cookie
   */
  getCSRFToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_COOKIE_NAME) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },
  
  /**
   * Add CSRF token to fetch requests
   */
  addCSRFToken(headers: HeadersInit = {}): HeadersInit {
    const token = this.getCSRFToken();
    if (token) {
      return {
        ...headers,
        [CSRF_HEADER_NAME]: token
      };
    }
    return headers;
  },
  
  /**
   * Secure fetch wrapper
   */
  async secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const secureOptions: RequestInit = {
      ...options,
      headers: this.addCSRFToken(options.headers),
      credentials: 'same-origin' // Ensure cookies are sent
    };
    
    return fetch(url, secureOptions);
  }
};