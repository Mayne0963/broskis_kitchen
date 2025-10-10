/**
 * Shared cache system with in-memory Map and TTL support
 * Provides fast caching for user lookups and auth operations
 */

interface CacheEntry {
  v: any;
  t: number;
}

// In-memory cache with TTL
const mem = new Map<string, CacheEntry>();
const TTL = 60_000; // 60 seconds

/**
 * Get value from cache if not expired
 */
export async function cacheGet(k: string): Promise<any> {
  const x = mem.get(k);
  if (x && (Date.now() - x.t < TTL)) {
    return x.v;
  }
  // Remove expired entry
  if (x) {
    mem.delete(k);
  }
  return null;
}

/**
 * Set value in cache with current timestamp
 */
export async function cacheSet(k: string, v: any): Promise<void> {
  mem.set(k, { v, t: Date.now() });
}

/**
 * Delete specific key from cache
 */
export async function cacheDelete(k: string): Promise<void> {
  mem.delete(k);
}

/**
 * Clear all cache entries
 */
export async function cacheClear(): Promise<void> {
  mem.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const [key, entry] of mem.entries()) {
    if (now - entry.t < TTL) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }

  return {
    totalEntries: mem.size,
    validEntries,
    expiredEntries,
    ttlMs: TTL,
  };
}

/**
 * Clean up expired entries
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of mem.entries()) {
    if (now - entry.t >= TTL) {
      mem.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  user: (email: string) => `u:${email.toLowerCase()}`,
  userByUid: (uid: string) => `uid:${uid}`,
  userProfile: (uid: string) => `profile:${uid}`,
  adminCheck: (email: string) => `admin:${email.toLowerCase()}`,
  session: (sessionId: string) => `session:${sessionId}`,
} as const;

/**
 * Cache with automatic key generation for user operations
 */
export const UserCache = {
  async getUser(email: string) {
    return cacheGet(CacheKeys.user(email));
  },

  async setUser(email: string, user: any) {
    await cacheSet(CacheKeys.user(email), user);
    // Also cache by UID if available
    if (user?.uid) {
      await cacheSet(CacheKeys.userByUid(user.uid), user);
    }
  },

  async getUserByUid(uid: string) {
    return cacheGet(CacheKeys.userByUid(uid));
  },

  async setUserByUid(uid: string, user: any) {
    await cacheSet(CacheKeys.userByUid(uid), user);
    // Also cache by email if available
    if (user?.email) {
      await cacheSet(CacheKeys.user(user.email), user);
    }
  },

  async invalidateUser(email?: string, uid?: string) {
    if (email) {
      await cacheDelete(CacheKeys.user(email));
      await cacheDelete(CacheKeys.adminCheck(email));
    }
    if (uid) {
      await cacheDelete(CacheKeys.userByUid(uid));
      await cacheDelete(CacheKeys.userProfile(uid));
    }
  },

  async getProfile(uid: string) {
    return cacheGet(CacheKeys.userProfile(uid));
  },

  async setProfile(uid: string, profile: any) {
    await cacheSet(CacheKeys.userProfile(uid), profile);
  },
};

// Periodic cleanup of expired entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredEntries();
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }, 5 * 60 * 1000);
}

export default {
  get: cacheGet,
  set: cacheSet,
  delete: cacheDelete,
  clear: cacheClear,
  stats: getCacheStats,
  cleanup: cleanupExpiredEntries,
  keys: CacheKeys,
}