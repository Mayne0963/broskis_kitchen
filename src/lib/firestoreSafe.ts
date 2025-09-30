/**
 * Firestore Safety Net Wrapper
 * 
 * Provides graceful handling of Firestore queries when indexes are still building
 * or missing. Prevents application crashes during index creation periods.
 */

import { db } from "@/lib/firebase/admin";

// Firestore error codes
const FAILED_PRECONDITION = 9;
const RESOURCE_EXHAUSTED = 8;
const DEADLINE_EXCEEDED = 4;

/**
 * Interface for building index placeholder response
 */
interface BuildingIndexResponse {
  buildingIndex: true;
  message: string;
  timestamp: number;
  retryAfter?: number;
}

/**
 * Interface for query retry configuration
 */
interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

/**
 * Safe query wrapper that handles missing indexes gracefully
 * 
 * @param fn - Async function that performs the Firestore query
 * @param options - Optional retry configuration
 * @returns Promise that resolves to query result or building index placeholder
 */
export async function safeQuery<T>(
  fn: () => Promise<T>, 
  options: RetryConfig = {}
): Promise<T | BuildingIndexResponse> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Handle index building errors
      if (error?.code === FAILED_PRECONDITION) {
        console.warn(`Firestore index still building (attempt ${attempt + 1}):`, error?.message);
        
        // If this is the last attempt, return placeholder
        if (attempt === config.maxRetries) {
          return {
            buildingIndex: true,
            message: "Firestore index is still building. Please try again in a few minutes.",
            timestamp: Date.now(),
            retryAfter: 300000 // 5 minutes
          } as BuildingIndexResponse;
        }
        
        // Wait before retrying
        const delay = calculateDelay(attempt, config);
        await sleep(delay);
        continue;
      }
      
      // Handle rate limiting
      if (error?.code === RESOURCE_EXHAUSTED) {
        console.warn(`Firestore rate limit exceeded (attempt ${attempt + 1}):`, error?.message);
        
        if (attempt === config.maxRetries) {
          throw new Error("Firestore rate limit exceeded. Please try again later.");
        }
        
        // Longer delay for rate limiting
        const delay = calculateDelay(attempt + 2, config);
        await sleep(delay);
        continue;
      }
      
      // Handle timeout errors
      if (error?.code === DEADLINE_EXCEEDED) {
        console.warn(`Firestore query timeout (attempt ${attempt + 1}):`, error?.message);
        
        if (attempt === config.maxRetries) {
          throw new Error("Firestore query timeout. Please try again.");
        }
        
        const delay = calculateDelay(attempt, config);
        await sleep(delay);
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Safe query wrapper specifically for collection queries
 * Returns empty array if index is building
 */
export async function safeCollectionQuery<T>(
  fn: () => Promise<FirebaseFirestore.QuerySnapshot<T>>,
  options: RetryConfig = {}
): Promise<FirebaseFirestore.QuerySnapshot<T> | T[]> {
  try {
    const result = await safeQuery(fn, options);
    
    // If index is building, return empty array
    if (result && typeof result === 'object' && 'buildingIndex' in result) {
      console.info("Index building, returning empty results");
      return [] as T[];
    }
    
    return result as FirebaseFirestore.QuerySnapshot<T>;
  } catch (error) {
    console.error("Safe collection query failed:", error);
    return [] as T[];
  }
}

/**
 * Safe query wrapper for document queries
 * Returns null if index is building or document not found
 */
export async function safeDocumentQuery<T>(
  fn: () => Promise<FirebaseFirestore.DocumentSnapshot<T>>,
  options: RetryConfig = {}
): Promise<FirebaseFirestore.DocumentSnapshot<T> | null> {
  try {
    const result = await safeQuery(fn, options);
    
    // If index is building, return null
    if (result && typeof result === 'object' && 'buildingIndex' in result) {
      console.info("Index building, returning null document");
      return null;
    }
    
    return result as FirebaseFirestore.DocumentSnapshot<T>;
  } catch (error) {
    console.error("Safe document query failed:", error);
    return null;
  }
}

/**
 * Check if a response indicates an index is building
 */
export function isIndexBuilding(response: any): response is BuildingIndexResponse {
  return response && typeof response === 'object' && response.buildingIndex === true;
}

/**
 * Utility function to create a safe query with predefined collection
 */
export function createSafeCollectionQuery<T>(collectionName: string) {
  return {
    /**
     * Safe where query
     */
    where: (field: string, operator: FirebaseFirestore.WhereFilterOp, value: any) => ({
      orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => ({
        limit: (count: number) => ({
          get: (options?: RetryConfig) => safeCollectionQuery<T>(
            () => db.collection(collectionName)
              .where(field, operator, value)
              .orderBy(field, direction)
              .limit(count)
              .get(),
            options
          )
        }),
        get: (options?: RetryConfig) => safeCollectionQuery<T>(
          () => db.collection(collectionName)
            .where(field, operator, value)
            .orderBy(field, direction)
            .get(),
          options
        )
      }),
      limit: (count: number) => ({
        get: (options?: RetryConfig) => safeCollectionQuery<T>(
          () => db.collection(collectionName)
            .where(field, operator, value)
            .limit(count)
            .get(),
          options
        )
      }),
      get: (options?: RetryConfig) => safeCollectionQuery<T>(
        () => db.collection(collectionName)
          .where(field, operator, value)
          .get(),
        options
      )
    })
  };
}

/**
 * Pre-configured safe query helpers for common collections
 */
export const safeQueries = {
  users: createSafeCollectionQuery('users'),
  orders: createSafeCollectionQuery('orders'),
  cateringRequests: createSafeCollectionQuery('cateringRequests'),
  rewards: createSafeCollectionQuery('rewards'),
  spins: createSafeCollectionQuery('spins'),
  coupons: createSafeCollectionQuery('coupons'),
  offers: createSafeCollectionQuery('offers'),
  menuItems: createSafeCollectionQuery('menuItems'),
  events: createSafeCollectionQuery('events')
};

// Export types for TypeScript users
export type { BuildingIndexResponse, RetryConfig };