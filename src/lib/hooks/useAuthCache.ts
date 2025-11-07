"use client"

import { useCallback, useRef } from 'react'

interface AuthCacheEntry {
  authenticated: boolean
  user: any | null
  timestamp: number
  sessionId?: string
}

interface AuthCacheOptions {
  maxAge: number // milliseconds
  keyPrefix: string
}

class AuthCache {
  private cache = new Map<string, AuthCacheEntry>()
  private options: AuthCacheOptions

  constructor(options: AuthCacheOptions = { maxAge: 5 * 60 * 1000, keyPrefix: 'auth' }) {
    this.options = options
  }

  private generateKey(sessionId?: string): string {
    return sessionId ? `${this.options.keyPrefix}:${sessionId}` : this.options.keyPrefix
  }

  get(sessionId?: string): AuthCacheEntry | null {
    const key = this.generateKey(sessionId)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if cache entry is expired
    const now = Date.now()
    if (now - entry.timestamp > this.options.maxAge) {
      this.cache.delete(key)
      return null
    }

    return entry
  }

  set(authenticated: boolean, user: any | null, sessionId?: string): void {
    const key = this.generateKey(sessionId)
    const entry: AuthCacheEntry = {
      authenticated,
      user,
      timestamp: Date.now(),
      sessionId
    }

    this.cache.set(key, entry)
  }

  clear(sessionId?: string): void {
    if (sessionId) {
      const key = this.generateKey(sessionId)
      this.cache.delete(key)
    } else {
      // Clear all entries with the prefix
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.startsWith(this.options.keyPrefix)
      )
      keysToDelete.forEach(key => this.cache.delete(key))
    }
  }

  clearExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.options.maxAge) {
        this.cache.delete(key)
      }
    }
  }

  size(): number {
    return this.cache.size
  }
}

// Global auth cache instance
const globalAuthCache = new AuthCache({
  maxAge: 3 * 60 * 1000, // 3 minutes
  keyPrefix: 'broski-auth'
})

// Session-based cache for different user sessions
const sessionAuthCache = new AuthCache({
  maxAge: 2 * 60 * 1000, // 2 minutes
  keyPrefix: 'broski-session'
})

export function useAuthCache() {
  const cacheRef = useRef(globalAuthCache)
  const sessionCacheRef = useRef(sessionAuthCache)

  const getCachedAuth = useCallback((sessionId?: string): AuthCacheEntry | null => {
    // Try session-specific cache first
    if (sessionId) {
      const sessionEntry = sessionCacheRef.current.get(sessionId)
      if (sessionEntry) return sessionEntry
    }

    // Fall back to global cache
    return cacheRef.current.get()
  }, [])

  const setCachedAuth = useCallback((
    authenticated: boolean, 
    user: any | null, 
    sessionId?: string
  ): void => {
    if (sessionId) {
      sessionCacheRef.current.set(authenticated, user, sessionId)
    } else {
      cacheRef.current.set(authenticated, user)
    }
  }, [])

  const clearAuthCache = useCallback((sessionId?: string): void => {
    if (sessionId) {
      sessionCacheRef.current.clear(sessionId)
    } else {
      cacheRef.current.clear()
      sessionCacheRef.current.clear()
    }
  }, [])

  const isCacheValid = useCallback((sessionId?: string): boolean => {
    const entry = getCachedAuth(sessionId)
    return entry !== null && (Date.now() - entry.timestamp) < 60000 // Valid for 1 minute
  }, [getCachedAuth])

  return {
    getCachedAuth,
    setCachedAuth,
    clearAuthCache,
    isCacheValid,
    cacheSize: cacheRef.current.size(),
    sessionCacheSize: sessionCacheRef.current.size()
  }
}

// Performance monitoring for auth operations
interface AuthPerformanceMetrics {
  cacheHits: number
  cacheMisses: number
  totalVerifications: number
  averageVerificationTime: number
  lastVerificationTime: number
}

class AuthPerformanceMonitor {
  private metrics: AuthPerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    totalVerifications: 0,
    averageVerificationTime: 0,
    lastVerificationTime: 0
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++
  }

  recordVerification(duration: number): void {
    this.metrics.totalVerifications++
    this.metrics.lastVerificationTime = duration
    
    // Update running average
    this.metrics.averageVerificationTime = 
      (this.metrics.averageVerificationTime * (this.metrics.totalVerifications - 1) + duration) / 
      this.metrics.totalVerifications
  }

  getMetrics(): AuthPerformanceMetrics {
    return { ...this.metrics }
  }

  reset(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalVerifications: 0,
      averageVerificationTime: 0,
      lastVerificationTime: 0
    }
  }
}

const performanceMonitor = new AuthPerformanceMonitor()

export function useAuthPerformance() {
  const monitorRef = useRef(performanceMonitor)

  const recordCacheHit = useCallback(() => {
    monitorRef.current.recordCacheHit()
  }, [])

  const recordCacheMiss = useCallback(() => {
    monitorRef.current.recordCacheMiss()
  }, [])

  const recordVerification = useCallback((duration: number) => {
    monitorRef.current.recordVerification(duration)
  }, [])

  const getMetrics = useCallback(() => {
    return monitorRef.current.getMetrics()
  }, [])

  const resetMetrics = useCallback(() => {
    monitorRef.current.reset()
  }, [])

  return {
    recordCacheHit,
    recordCacheMiss,
    recordVerification,
    getMetrics,
    resetMetrics
  }
}