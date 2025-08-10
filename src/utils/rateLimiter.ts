// Rate limiting utilities for Broski's Kitchen
import { config } from './config';

// Rate limiter interface
export interface RateLimiterConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string; // Custom key generator
}

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store for rate limiting (use Redis in production)
class MemoryStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  
  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }
  
  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value);
  }
  
  delete(key: string): void {
    this.store.delete(key);
  }
  
  clear(): void {
    this.store.clear();
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

// Generic rate limiter class
export class RateLimiter {
  private store: MemoryStore;
  private config: RateLimiterConfig;
  
  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.store = new MemoryStore();
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.store.cleanup();
    }, 5 * 60 * 1000);
  }
  
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    const resetTime = now + this.config.windowMs;
    
    const existing = this.store.get(key);
    
    if (!existing) {
      // First request in window
      this.store.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime
      };
    }
    
    if (existing.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime,
        retryAfter: Math.ceil((existing.resetTime - now) / 1000)
      };
    }
    
    // Increment count
    existing.count++;
    this.store.set(key, existing);
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - existing.count,
      resetTime: existing.resetTime
    };
  }
  
  async reset(identifier: string): Promise<void> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    this.store.delete(key);
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: config.apiLimits.requestsPerMinute,
  keyGenerator: (ip: string) => `api:${ip}`
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: config.security.maxLoginAttempts,
  keyGenerator: (identifier: string) => `auth:${identifier}`
});

export const orderRateLimiter = new RateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: config.security.maxOrdersPerDay,
  keyGenerator: (userId: string) => `orders:${userId}`
});

export const bookingRateLimiter = new RateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: config.security.maxBookingsPerUser,
  keyGenerator: (userId: string) => `bookings:${userId}`
});

// User-specific rate limiters
export class UserRateLimiter {
  private addressLimiter: RateLimiter;
  private paymentLimiter: RateLimiter;
  private profileLimiter: RateLimiter;
  
  constructor() {
    this.addressLimiter = new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // Max 10 address operations per hour
      keyGenerator: (userId: string) => `address:${userId}`
    });
    
    this.paymentLimiter = new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // Max 5 payment method operations per hour
      keyGenerator: (userId: string) => `payment:${userId}`
    });
    
    this.profileLimiter = new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20, // Max 20 profile updates per hour
      keyGenerator: (userId: string) => `profile:${userId}`
    });
  }
  
  async checkAddressLimit(userId: string): Promise<RateLimitResult> {
    return this.addressLimiter.checkLimit(userId);
  }
  
  async checkPaymentLimit(userId: string): Promise<RateLimitResult> {
    return this.paymentLimiter.checkLimit(userId);
  }
  
  async checkProfileLimit(userId: string): Promise<RateLimitResult> {
    return this.profileLimiter.checkLimit(userId);
  }
}

// Global user rate limiter instance
export const userRateLimiter = new UserRateLimiter();

// Middleware helper for Next.js API routes
export function createRateLimitMiddleware(limiter: RateLimiter, getIdentifier: (req: any) => string) {
  return async (req: any, res: any, next: () => void) => {
    try {
      const identifier = getIdentifier(req);
      const result = await limiter.checkLimit(identifier);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limiter['config'].maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      
      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter || 60);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Allow request to proceed if rate limiting fails
      next();
    }
  };
}

// Common identifier extractors
export const identifierExtractors = {
  ip: (req: any) => {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           'unknown';
  },
  
  userId: (req: any) => {
    return req.user?.id || req.auth?.userId || 'anonymous';
  },
  
  email: (req: any) => {
    return req.user?.email || req.body?.email || 'anonymous';
  },
  
  sessionId: (req: any) => {
    return req.sessionID || req.headers['x-session-id'] || 'anonymous';
  }
};

// Pre-configured middleware
export const apiRateLimit = createRateLimitMiddleware(apiRateLimiter, identifierExtractors.ip);
export const authRateLimit = createRateLimitMiddleware(authRateLimiter, identifierExtractors.email);
export const userActionRateLimit = createRateLimitMiddleware(
  new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute per user
    keyGenerator: (userId: string) => `user-action:${userId}`
  }),
  identifierExtractors.userId
);

// Burst protection for sensitive operations
export const sensitiveOperationRateLimit = createRateLimitMiddleware(
  new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // Only 3 sensitive operations per 5 minutes
    keyGenerator: (userId: string) => `sensitive:${userId}`
  }),
  identifierExtractors.userId
);

// Helper functions
export async function checkUserOrderLimit(userId: string): Promise<boolean> {
  const result = await orderRateLimiter.checkLimit(userId);
  return result.allowed;
}

export async function checkUserBookingLimit(userId: string): Promise<boolean> {
  const result = await bookingRateLimiter.checkLimit(userId);
  return result.allowed;
}

export async function checkApiLimit(ip: string): Promise<boolean> {
  const result = await apiRateLimiter.checkLimit(ip);
  return result.allowed;
}

export async function checkAuthLimit(email: string): Promise<boolean> {
  const result = await authRateLimiter.checkLimit(email);
  return result.allowed;
}

// Rate limit status checker
export async function getRateLimitStatus(identifier: string, limiter: RateLimiter): Promise<RateLimitResult> {
  return limiter.checkLimit(identifier);
}

// Reset rate limits (for admin use)
export async function resetUserRateLimits(userId: string): Promise<void> {
  await orderRateLimiter.reset(userId);
  await bookingRateLimiter.reset(userId);
  await userRateLimiter.addressLimiter.reset(userId);
  await userRateLimiter.paymentLimiter.reset(userId);
  await userRateLimiter.profileLimiter.reset(userId);
}

export default {
  RateLimiter,
  apiRateLimiter,
  authRateLimiter,
  orderRateLimiter,
  bookingRateLimiter,
  userRateLimiter,
  createRateLimitMiddleware,
  identifierExtractors,
  checkUserOrderLimit,
  checkUserBookingLimit,
  checkApiLimit,
  checkAuthLimit,
  getRateLimitStatus,
  resetUserRateLimits
};