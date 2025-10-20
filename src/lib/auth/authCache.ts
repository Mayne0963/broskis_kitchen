interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
}

interface AuthCacheData {
  isAuthenticated: boolean
  isEmailVerified: boolean
  userRole: string | null
  userId: string | null
}

class AuthCache {
  private static instance: AuthCache
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): AuthCache {
    if (!AuthCache.instance) {
      AuthCache.instance = new AuthCache()
    }
    return AuthCache.instance
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Auth-specific methods
  setAuthData(userId: string, data: AuthCacheData, ttl?: number): void {
    this.set(`auth:${userId}`, data, ttl)
    this.set('auth:current', data, ttl) // Also cache as current user
  }

  getAuthData(userId?: string): AuthCacheData | null {
    if (userId) {
      return this.get(`auth:${userId}`)
    }
    return this.get('auth:current')
  }

  setRouteAccess(route: string, hasAccess: boolean, ttl?: number): void {
    this.set(`route:${route}`, hasAccess, ttl || 2 * 60 * 1000) // 2 minutes for route access
  }

  getRouteAccess(route: string): boolean | null {
    return this.get(`route:${route}`)
  }

  invalidateUser(userId: string): void {
    this.delete(`auth:${userId}`)
    this.delete('auth:current')
    
    // Clear all route access for this user
    const routeKeys = Array.from(this.cache.keys()).filter(key => key.startsWith('route:'))
    routeKeys.forEach(key => this.delete(key))
  }

  // Preload authentication data
  async preloadAuthData(): Promise<void> {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.isAuthenticated && data.user) {
          this.setAuthData(data.user.uid, {
            isAuthenticated: data.isAuthenticated,
            isEmailVerified: data.isEmailVerified,
            userRole: data.user.role,
            userId: data.user.uid
          })
        }
      }
    } catch (error) {
      console.error('Failed to preload auth data:', error)
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: this.getHitRate()
    }
  }

  private hitRate = 0
  private hits = 0
  private misses = 0

  private getHitRate(): number {
    const total = this.hits + this.misses
    return total > 0 ? (this.hits / total) * 100 : 0
  }

  // Track cache performance
  recordHit(): void {
    this.hits++
  }

  recordMiss(): void {
    this.misses++
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key))
  }
}

export const authCache = AuthCache.getInstance()

// React hook for cached authentication data
export function useCachedAuth() {
  const [authData, setAuthData] = React.useState<AuthCacheData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Try to get from cache first
    const cached = authCache.getAuthData()
    
    if (cached) {
      setAuthData(cached)
      setIsLoading(false)
      authCache.recordHit()
    } else {
      authCache.recordMiss()
      // Fetch from API if not in cache
      fetchAuthData()
    }
  }, [])

  const fetchAuthData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const authData: AuthCacheData = {
          isAuthenticated: data.isAuthenticated,
          isEmailVerified: data.isEmailVerified,
          userRole: data.user?.role || null,
          userId: data.user?.uid || null
        }
        
        setAuthData(authData)
        
        if (data.user) {
          authCache.setAuthData(data.user.uid, authData)
        }
      }
    } catch (error) {
      console.error('Failed to fetch auth data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const invalidate = () => {
    if (authData?.userId) {
      authCache.invalidateUser(authData.userId)
    }
    setAuthData(null)
    fetchAuthData()
  }

  return {
    authData,
    isLoading,
    refetch: fetchAuthData,
    invalidate
  }
}

// Preload authentication data on app start
export function preloadAuthCache() {
  if (typeof window !== 'undefined') {
    authCache.preloadAuthData()
    
    // Set up periodic cleanup
    setInterval(() => {
      authCache.cleanup()
    }, 5 * 60 * 1000) // Cleanup every 5 minutes
  }
}

// Import React for the hook
import React from 'react'