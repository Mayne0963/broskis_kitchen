import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  blockDuration?: number // How long to block after limit exceeded
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export class RateLimiter {
  private static instance: RateLimiter
  private store = new Map<string, RateLimitEntry>()
  private configs = new Map<string, RateLimitConfig>()

  private constructor() {
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }

  configure(key: string, config: RateLimitConfig): void {
    this.configs.set(key, config)
  }

  private getClientId(request: NextRequest): string {
    // Try to get user ID from session first
    const userId = request.headers.get('x-user-id')
    if (userId) {
      return `user:${userId}`
    }

    // Fall back to IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
    return `ip:${ip}`
  }

  check(request: NextRequest, limitKey: string): {
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  } {
    const config = this.configs.get(limitKey)
    if (!config) {
      throw new Error(`Rate limit configuration not found for key: ${limitKey}`)
    }

    const clientId = this.getClientId(request)
    const key = `${limitKey}:${clientId}`
    const now = Date.now()

    let entry = this.store.get(key)

    // Initialize or reset if window expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false
      }
    }

    // Check if client is currently blocked
    if (entry.blocked && config.blockDuration) {
      const blockEndTime = entry.resetTime + config.blockDuration
      if (now < blockEndTime) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.resetTime,
          retryAfter: Math.ceil((blockEndTime - now) / 1000)
        }
      } else {
        // Block period expired, reset
        entry.blocked = false
        entry.count = 0
        entry.resetTime = now + config.windowMs
      }
    }

    // Increment counter
    entry.count++
    this.store.set(key, entry)

    const remaining = Math.max(0, config.maxRequests - entry.count)
    const allowed = entry.count <= config.maxRequests

    // Block client if limit exceeded and block duration is configured
    if (!allowed && config.blockDuration) {
      entry.blocked = true
      this.store.set(key, entry)
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
    }
  }

  reset(request: NextRequest, limitKey: string): void {
    const clientId = this.getClientId(request)
    const key = `${limitKey}:${clientId}`
    this.store.delete(key)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      // Remove entries that are past their reset time and not blocked
      if (now >= entry.resetTime && !entry.blocked) {
        this.store.delete(key)
      }
      // Remove blocked entries that are past their block duration
      else if (entry.blocked) {
        const limitKey = key.split(':')[0]
        const config = this.configs.get(limitKey)
        if (config?.blockDuration) {
          const blockEndTime = entry.resetTime + config.blockDuration
          if (now >= blockEndTime) {
            this.store.delete(key)
          }
        }
      }
    }
  }

  getStats(): {
    totalEntries: number
    blockedClients: number
    configuredLimits: string[]
  } {
    const blockedClients = Array.from(this.store.values()).filter(entry => entry.blocked).length
    
    return {
      totalEntries: this.store.size,
      blockedClients,
      configuredLimits: Array.from(this.configs.keys())
    }
  }
}

export const rateLimiter = RateLimiter.getInstance()

// Configure common rate limits
rateLimiter.configure('auth', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  blockDuration: 30 * 60 * 1000 // Block for 30 minutes after limit exceeded
})

rateLimiter.configure('api', {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  blockDuration: 5 * 60 * 1000 // Block for 5 minutes
})

rateLimiter.configure('password-reset', {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 password reset attempts per hour
  blockDuration: 60 * 60 * 1000 // Block for 1 hour
})

rateLimiter.configure('email-verification', {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 verification emails per hour
  blockDuration: 30 * 60 * 1000 // Block for 30 minutes
})

// Middleware function to apply rate limiting
export function applyRateLimit(request: NextRequest, limitKey: string) {
  const result = rateLimiter.check(request, limitKey)
  
  return {
    ...result,
    headers: {
      'X-RateLimit-Limit': rateLimiter.configs.get(limitKey)?.maxRequests.toString() || '0',
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
    }
  }
}

// Rate limit response helper
export function createRateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  )
}