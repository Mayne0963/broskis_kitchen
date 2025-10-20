import { SessionUser } from './session';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum number of cached entries

// In-memory cache for authentication state
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class AuthCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    
    // Update access order for LRU
    this.updateAccessOrder(key);
    
    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl: number = CACHE_DURATION): void {
    // Ensure cache size limit
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictLRU();
    }
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };
    
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  /**
   * Delete cached data
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    return deleted;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      this.cache.delete(lruKey);
    }
  }

  private calculateHitRate(): number {
    // This would need to be tracked separately in a real implementation
    return 0.85; // Placeholder
  }

  private estimateMemoryUsage(): number {
    // Rough estimation in bytes
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2;
      size += 24; // Overhead for timestamps and structure
    }
    return size;
  }
}

// Global cache instance
const authCache = new AuthCache();

/**
 * Cache keys generator
 */
export const cacheKeys = {
  userSession: (uid: string) => `user:session:${uid}`,
  userProfile: (uid: string) => `user:profile:${uid}`,
  userPermissions: (uid: string) => `user:permissions:${uid}`,
  authStatus: (sessionId: string) => `auth:status:${sessionId}`,
  csrfToken: (sessionId: string) => `csrf:token:${sessionId}`
};

/**
 * Cached session verification
 */
export async function getCachedSession(sessionCookie: string): Promise<SessionUser | null> {
  try {
    // Extract session ID from cookie for cache key
    const parts = sessionCookie.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    const cacheKey = cacheKeys.userSession(payload.uid);
    
    // Try cache first
    const cached = authCache.get<SessionUser>(cacheKey);
    if (cached) {
      // Verify cache is still valid (not expired)
      if (cached.exp && cached.exp > Math.floor(Date.now() / 1000)) {
        return cached;
      } else {
        authCache.delete(cacheKey);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Cache session retrieval error:', error);
    return null;
  }
}

/**
 * Cache session data
 */
export function cacheSession(user: SessionUser): void {
  try {
    const cacheKey = cacheKeys.userSession(user.uid);
    const ttl = user.exp ? (user.exp * 1000 - Date.now()) : CACHE_DURATION;
    
    if (ttl > 0) {
      authCache.set(cacheKey, user, Math.min(ttl, CACHE_DURATION));
    }
  } catch (error) {
    console.error('Cache session storage error:', error);
  }
}

/**
 * Invalidate user cache
 */
export function invalidateUserCache(uid: string): void {
  authCache.delete(cacheKeys.userSession(uid));
  authCache.delete(cacheKeys.userProfile(uid));
  authCache.delete(cacheKeys.userPermissions(uid));
}

/**
 * Preload authentication data
 */
export async function preloadAuthData(uid: string): Promise<void> {
  try {
    // Preload user profile and permissions in parallel
    const promises = [
      preloadUserProfile(uid),
      preloadUserPermissions(uid)
    ];
    
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Auth data preload error:', error);
  }
}

/**
 * Preload user profile
 */
async function preloadUserProfile(uid: string): Promise<void> {
  const cacheKey = cacheKeys.userProfile(uid);
  
  if (!authCache.get(cacheKey)) {
    try {
      // This would typically fetch from Firestore
      // For now, we'll just cache a placeholder
      const profile = {
        uid,
        lastSeen: new Date().toISOString(),
        preferences: {}
      };
      
      authCache.set(cacheKey, profile);
    } catch (error) {
      console.error('User profile preload error:', error);
    }
  }
}

/**
 * Preload user permissions
 */
async function preloadUserPermissions(uid: string): Promise<void> {
  const cacheKey = cacheKeys.userPermissions(uid);
  
  if (!authCache.get(cacheKey)) {
    try {
      // This would typically fetch from database
      const permissions = {
        canAccessDashboard: true,
        canPlaceOrders: true,
        canViewLoyalty: true,
        isAdmin: false
      };
      
      authCache.set(cacheKey, permissions);
    } catch (error) {
      console.error('User permissions preload error:', error);
    }
  }
}

/**
 * Client-side performance utilities
 */
export const clientPerformance = {
  /**
   * Debounced authentication check
   */
  debounceAuthCheck: (() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (callback: () => void, delay: number = 300) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(callback, delay);
    };
  })(),

  /**
   * Throttled session refresh
   */
  throttleSessionRefresh: (() => {
    let lastRefresh = 0;
    const THROTTLE_DURATION = 60 * 1000; // 1 minute
    
    return async (refreshFn: () => Promise<void>): Promise<void> => {
      const now = Date.now();
      
      if (now - lastRefresh >= THROTTLE_DURATION) {
        lastRefresh = now;
        await refreshFn();
      }
    };
  })(),

  /**
   * Optimistic authentication state
   */
  optimisticAuth: {
    pendingActions: new Set<string>(),
    
    addPendingAction(actionId: string): void {
      this.pendingActions.add(actionId);
    },
    
    removePendingAction(actionId: string): void {
      this.pendingActions.delete(actionId);
    },
    
    hasPendingActions(): boolean {
      return this.pendingActions.size > 0;
    }
  },

  /**
   * Background authentication sync
   */
  backgroundSync: {
    intervalId: null as NodeJS.Timeout | null,
    
    start(syncFn: () => Promise<void>, interval: number = 5 * 60 * 1000): void {
      this.stop(); // Clear any existing interval
      
      this.intervalId = setInterval(async () => {
        try {
          await syncFn();
        } catch (error) {
          console.error('Background auth sync error:', error);
        }
      }, interval);
    },
    
    stop(): void {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }
};

/**
 * Performance monitoring
 */
export class AuthPerformanceMonitor {
  private metrics = {
    authChecks: 0,
    cacheHits: 0,
    cacheMisses: 0,
    sessionRefreshes: 0,
    errors: 0
  };

  recordAuthCheck(): void {
    this.metrics.authChecks++;
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  recordSessionRefresh(): void {
    this.metrics.sessionRefreshes++;
  }

  recordError(): void {
    this.metrics.errors++;
  }

  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? this.metrics.cacheHits / total : 0;
  }

  reset(): void {
    this.metrics = {
      authChecks: 0,
      cacheHits: 0,
      cacheMisses: 0,
      sessionRefreshes: 0,
      errors: 0
    };
  }
}

// Global performance monitor
export const authPerformanceMonitor = new AuthPerformanceMonitor();

/**
 * Cache cleanup utility
 */
export function cleanupAuthCache(): void {
  authCache.clear();
  console.log('Authentication cache cleared');
}

// Cleanup on page unload (browser only)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    clientPerformance.backgroundSync.stop();
  });
}