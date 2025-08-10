import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { RateLimitError } from './error-handler';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// In-memory store for rate limiting (use Redis in production)
class MemoryStore {
  private store = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<RateLimitRecord | null> {
    const record = this.store.get(key);
    if (!record) return null;
    
    // Check if record has expired
    if (Date.now() > record.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return record;
  }

  async set(key: string, record: RateLimitRecord): Promise<void> {
    this.store.set(key, record);
  }

  async increment(key: string, windowMs: number): Promise<RateLimitRecord> {
    const now = Date.now();
    const existing = await this.get(key);
    
    if (!existing) {
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      };
      await this.set(key, newRecord);
      return newRecord;
    }
    
    existing.count++;
    await this.set(key, existing);
    return existing;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Firebase store for persistent rate limiting
class FirebaseStore {
  private collectionName = 'rate_limits';

  async get(key: string): Promise<RateLimitRecord | null> {
    try {
      const doc = await db.collection(this.collectionName).doc(key).get();
      if (!doc.exists) return null;
      
      const data = doc.data() as RateLimitRecord;
      
      // Check if record has expired
      if (Date.now() > data.resetTime) {
        await doc.ref.delete();
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting rate limit record:', error);
      return null;
    }
  }

  async set(key: string, record: RateLimitRecord): Promise<void> {
    try {
      await db.collection(this.collectionName).doc(key).set(record);
    } catch (error) {
      console.error('Error setting rate limit record:', error);
    }
  }

  async increment(key: string, windowMs: number): Promise<RateLimitRecord> {
    const now = Date.now();
    const docRef = db.collection(this.collectionName).doc(key);
    
    try {
      const result = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        
        if (!doc.exists) {
          const newRecord: RateLimitRecord = {
            count: 1,
            resetTime: now + windowMs,
            firstRequest: now
          };
          transaction.set(docRef, newRecord);
          return newRecord;
        }
        
        const existing = doc.data() as RateLimitRecord;
        
        // Check if window has expired
        if (now > existing.resetTime) {
          const newRecord: RateLimitRecord = {
            count: 1,
            resetTime: now + windowMs,
            firstRequest: now
          };
          transaction.set(docRef, newRecord);
          return newRecord;
        }
        
        const updatedRecord: RateLimitRecord = {
          ...existing,
          count: existing.count + 1
        };
        transaction.update(docRef, { count: updatedRecord.count });
        return updatedRecord;
      });
      
      return result;
    } catch (error) {
      console.error('Error incrementing rate limit:', error);
      // Fallback to memory store
      const memoryStore = new MemoryStore();
      return await memoryStore.increment(key, windowMs);
    }
  }
}

// Rate limiter class
export class RateLimiter {
  private store: MemoryStore | FirebaseStore;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig, useFirebaseStore = false) {
    this.store = useFirebaseStore ? new FirebaseStore() : new MemoryStore();
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      message: config.message || 'Too many requests, please try again later'
    };
  }

  private defaultKeyGenerator(request: NextRequest): string {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    return `ip:${ip}`;
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.config.keyGenerator(request);
    const record = await this.store.increment(key, this.config.windowMs);
    
    const allowed = record.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - record.count);
    
    const result = {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime: record.resetTime
    };
    
    if (!allowed) {
      const retryAfter = Math.ceil((record.resetTime - Date.now()) / 1000);
      return { ...result, retryAfter };
    }
    
    return result;
  }

  middleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkLimit(request);
      
      if (!result.allowed) {
        const response = NextResponse.json(
          {
            error: this.config.message,
            code: 'RATE_LIMIT_EXCEEDED',
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            retryAfter: result.retryAfter
          },
          { status: 429 }
        );
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
        if (result.retryAfter) {
          response.headers.set('Retry-After', result.retryAfter.toString());
        }
        
        return response;
      }
      
      return null; // Allow request to proceed
    };
  }
}

// Predefined rate limiters for different use cases
export const rateLimiters = {
  // General API rate limiter
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later'
  }),
  
  // Strict rate limiter for sensitive endpoints
  strict: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 requests per 15 minutes
    message: 'Rate limit exceeded for sensitive operation'
  }),
  
  // Authentication rate limiter
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    keyGenerator: (request) => {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      return `auth:${ip}`;
    },
    message: 'Too many authentication attempts, please try again later'
  }),
  
  // Order creation rate limiter
  orderCreation: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 orders per 5 minutes
    keyGenerator: (request) => {
      // Rate limit by user ID if authenticated
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        try {
          const token = authHeader.split('Bearer ')[1];
          // This would need to be decoded, but for simplicity using IP
          const ip = request.headers.get('x-forwarded-for') || 'unknown';
          return `order:${ip}`;
        } catch {
          const ip = request.headers.get('x-forwarded-for') || 'unknown';
          return `order:${ip}`;
        }
      }
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      return `order:${ip}`;
    },
    message: 'Too many orders created, please wait before placing another order'
  }),
  
  // Payment processing rate limiter
  payment: new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 5, // 5 payment attempts per 10 minutes
    keyGenerator: (request) => {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      return `payment:${ip}`;
    },
    message: 'Too many payment attempts, please try again later'
  }),
  
  // SMS/Email notification rate limiter
  notification: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 notifications per hour
    keyGenerator: (request) => {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      return `notification:${ip}`;
    },
    message: 'Too many notifications sent, please try again later'
  })
};

// Utility function to apply rate limiting to API routes
export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const rateLimitResponse = await rateLimiter.middleware()(request);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    const response = await handler(request, ...args);
    
    // Add rate limit headers to successful responses
    const result = await rateLimiter.checkLimit(request);
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return response;
  };
}

// Advanced rate limiting with user-based limits
export class UserRateLimiter {
  private store: FirebaseStore;
  
  constructor() {
    this.store = new FirebaseStore();
  }
  
  async checkUserLimit(
    userId: string,
    action: string,
    config: { windowMs: number; maxRequests: number }
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `user:${userId}:${action}`;
    const record = await this.store.increment(key, config.windowMs);
    
    const allowed = record.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - record.count);
    
    return {
      allowed,
      remaining,
      resetTime: record.resetTime
    };
  }
}

// Export singleton instance
export const userRateLimiter = new UserRateLimiter();

// Rate limiting configurations for different user tiers
export const userTierLimits = {
  free: {
    ordersPerDay: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 5 },
    apiCallsPerHour: { windowMs: 60 * 60 * 1000, maxRequests: 100 }
  },
  premium: {
    ordersPerDay: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 20 },
    apiCallsPerHour: { windowMs: 60 * 60 * 1000, maxRequests: 500 }
  },
  enterprise: {
    ordersPerDay: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 100 },
    apiCallsPerHour: { windowMs: 60 * 60 * 1000, maxRequests: 2000 }
  }
};