import { db } from '@/lib/firebaseAdmin';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags?: string[]; // For cache invalidation
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

// In-memory cache implementation
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout;
  private accessTimes = new Map<string, number>();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      ...config
    };

    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  set<T>(key: string, data: T, ttl?: number, tags?: string[]): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.config.defaultTTL,
      tags
    };

    // Check if cache is full and evict LRU entry
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.accessTimes.set(key, now);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(key, now);
    return entry.data;
  }

  delete(key: string): boolean {
    this.accessTimes.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        count++;
      }
    }
    return count;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return false;
    }
    
    return true;
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const now = Date.now();
    let oldest = now;
    let newest = 0;
    
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    }
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need to track hits/misses
      oldestEntry: oldest,
      newestEntry: newest
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.accessTimes.delete(key);
    });
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Firebase-based cache for persistence
class FirebaseCache {
  private collectionName = 'cache_entries';
  private memoryCache: MemoryCache;

  constructor() {
    this.memoryCache = new MemoryCache({
      defaultTTL: 2 * 60 * 1000, // 2 minutes for memory cache
      maxSize: 500
    });
  }

  async set<T>(key: string, data: T, ttl?: number, tags?: string[]): Promise<void> {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || 5 * 60 * 1000, // 5 minutes default
      tags
    };

    // Set in memory cache first
    this.memoryCache.set(key, data, ttl, tags);

    // Set in Firebase for persistence
    try {
      await db.collection(this.collectionName).doc(key).set({
        ...entry,
        expiresAt: new Date(now + entry.ttl)
      });
    } catch (error) {
      console.error('Error setting cache in Firebase:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryResult = this.memoryCache.get<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // Try Firebase cache
    try {
      const doc = await db.collection(this.collectionName).doc(key).get();
      
      if (!doc.exists) {
        return null;
      }

      const entry = doc.data() as CacheEntry<T> & { expiresAt: any };
      const now = Date.now();
      
      // Check if expired
      if (now > entry.expiresAt.toMillis()) {
        await doc.ref.delete();
        return null;
      }

      // Store in memory cache for faster access
      const remainingTTL = entry.expiresAt.toMillis() - now;
      this.memoryCache.set(key, entry.data, remainingTTL, entry.tags);
      
      return entry.data;
    } catch (error) {
      console.error('Error getting cache from Firebase:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    this.memoryCache.delete(key);
    
    try {
      await db.collection(this.collectionName).doc(key).delete();
      return true;
    } catch (error) {
      console.error('Error deleting cache from Firebase:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      const batch = db.batch();
      const snapshot = await db.collection(this.collectionName).get();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error clearing cache from Firebase:', error);
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    const memoryCount = this.memoryCache.invalidateByTag(tag);
    
    try {
      const snapshot = await db.collection(this.collectionName)
        .where('tags', 'array-contains', tag)
        .get();
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return memoryCount + snapshot.docs.length;
    } catch (error) {
      console.error('Error invalidating cache by tag:', error);
      return memoryCount;
    }
  }
}

// Main cache service
export class CacheService {
  private memoryCache: MemoryCache;
  private firebaseCache: FirebaseCache;
  private useFirebase: boolean;

  constructor(useFirebase = false) {
    this.memoryCache = new MemoryCache();
    this.firebaseCache = new FirebaseCache();
    this.useFirebase = useFirebase;
  }

  async set<T>(key: string, data: T, ttl?: number, tags?: string[]): Promise<void> {
    if (this.useFirebase) {
      await this.firebaseCache.set(key, data, ttl, tags);
    } else {
      this.memoryCache.set(key, data, ttl, tags);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useFirebase) {
      return await this.firebaseCache.get<T>(key);
    } else {
      return this.memoryCache.get<T>(key);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (this.useFirebase) {
      return await this.firebaseCache.delete(key);
    } else {
      return this.memoryCache.delete(key);
    }
  }

  async clear(): Promise<void> {
    if (this.useFirebase) {
      await this.firebaseCache.clear();
    } else {
      this.memoryCache.clear();
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    if (this.useFirebase) {
      return await this.firebaseCache.invalidateByTag(tag);
    } else {
      return this.memoryCache.invalidateByTag(tag);
    }
  }

  // Utility method for caching function results
  async cached<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
    tags?: string[]
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl, tags);
    return result;
  }

  // Method for caching with automatic key generation
  async cachedWithKey<T>(
    keyParts: (string | number)[],
    fn: () => Promise<T>,
    ttl?: number,
    tags?: string[]
  ): Promise<T> {
    const key = keyParts.join(':');
    return this.cached(key, fn, ttl, tags);
  }
}

// Singleton cache service instance
export const cacheService = new CacheService(process.env.NODE_ENV === 'production');

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  order: (orderId: string) => `order:${orderId}`,
  ordersByUser: (userId: string, page: number = 1) => `orders:user:${userId}:page:${page}`,
  restaurant: (restaurantId: string) => `restaurant:${restaurantId}`,
  restaurantMenu: (restaurantId: string) => `restaurant:menu:${restaurantId}`,
  menuItem: (itemId: string) => `menu:item:${itemId}`,
  delivery: (deliveryId: string) => `delivery:${deliveryId}`,
  driverLocation: (driverId: string) => `driver:location:${driverId}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  popularItems: (restaurantId: string, period: string) => `popular:items:${restaurantId}:${period}`,
  notifications: (userId: string) => `notifications:${userId}`,
  chatMessages: (deliveryId: string, page: number = 1) => `chat:${deliveryId}:page:${page}`
};

// Cache tags for invalidation
export const cacheTags = {
  user: (userId: string) => `user:${userId}`,
  order: (orderId: string) => `order:${orderId}`,
  restaurant: (restaurantId: string) => `restaurant:${restaurantId}`,
  delivery: (deliveryId: string) => `delivery:${deliveryId}`,
  driver: (driverId: string) => `driver:${driverId}`,
  analytics: 'analytics',
  menu: 'menu',
  notifications: 'notifications'
};

// Cache TTL constants (in milliseconds)
export const cacheTTL = {
  short: 2 * 60 * 1000,      // 2 minutes
  medium: 5 * 60 * 1000,     // 5 minutes
  long: 15 * 60 * 1000,      // 15 minutes
  hour: 60 * 60 * 1000,      // 1 hour
  day: 24 * 60 * 60 * 1000   // 24 hours
};

// Decorator for caching method results
export function cached(ttl: number = cacheTTL.medium, tags?: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      return cacheService.cached(
        key,
        () => method.apply(this, args),
        ttl,
        tags
      );
    };
    
    return descriptor;
  };
}

// Helper functions for common caching patterns
export const cacheHelpers = {
  // Cache user data
  async cacheUser(userId: string, userData: any, ttl = cacheTTL.medium) {
    await cacheService.set(
      cacheKeys.user(userId),
      userData,
      ttl,
      [cacheTags.user(userId)]
    );
  },

  // Cache order data
  async cacheOrder(orderId: string, orderData: any, ttl = cacheTTL.medium) {
    await cacheService.set(
      cacheKeys.order(orderId),
      orderData,
      ttl,
      [cacheTags.order(orderId), cacheTags.user(orderData.customerId)]
    );
  },

  // Cache restaurant menu
  async cacheRestaurantMenu(restaurantId: string, menuData: any, ttl = cacheTTL.long) {
    await cacheService.set(
      cacheKeys.restaurantMenu(restaurantId),
      menuData,
      ttl,
      [cacheTags.restaurant(restaurantId), cacheTags.menu]
    );
  },

  // Invalidate user-related cache
  async invalidateUserCache(userId: string) {
    await cacheService.invalidateByTag(cacheTags.user(userId));
  },

  // Invalidate order-related cache
  async invalidateOrderCache(orderId: string) {
    await cacheService.invalidateByTag(cacheTags.order(orderId));
  },

  // Invalidate restaurant-related cache
  async invalidateRestaurantCache(restaurantId: string) {
    await cacheService.invalidateByTag(cacheTags.restaurant(restaurantId));
  }
};