/**
 * Dynamic import retry utilities for handling chunk loading failures
 * Works in conjunction with ChunkErrorHandler component
 */

// Retry configuration
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  exponentialBackoff: boolean
  jitter: boolean
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  exponentialBackoff: true,
  jitter: true, // Add randomness to prevent thundering herd
}

// Track retry attempts globally
const globalRetryAttempts = new Map<string, number>()
const permanentlyFailedChunks = new Set<string>()

/**
 * Check if an error is related to chunk loading
 */
export const isChunkLoadError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false
  
  const chunkErrorPatterns = [
    /Loading chunk \d+ failed/i,
    /Loading CSS chunk \d+ failed/i,
    /ChunkLoadError/i,
    /Failed to import/i,
    /NetworkError/i,
    /fetch.*failed/i,
    /Script error/i,
  ]
  
  return chunkErrorPatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.name)
  )
}

/**
 * Calculate retry delay with exponential backoff and jitter
 */
const calculateRetryDelay = (
  attempt: number, 
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number => {
  let delay = config.baseDelay
  
  if (config.exponentialBackoff) {
    delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay)
  }
  
  if (config.jitter) {
    // Add ±25% jitter to prevent thundering herd
    const jitterRange = delay * 0.25
    delay += (Math.random() - 0.5) * 2 * jitterRange
  }
  
  return Math.max(delay, 100) // Minimum 100ms delay
}

/**
 * Enhanced dynamic import with comprehensive retry logic
 */
export const retryDynamicImport = async <T>(
  importFn: () => Promise<T>,
  chunkName: string = `chunk_${Date.now()}`,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  
  // Check if chunk has permanently failed
  if (permanentlyFailedChunks.has(chunkName)) {
    throw new Error(`Chunk ${chunkName} has permanently failed and will not be retried`)
  }
  
  const currentAttempt = globalRetryAttempts.get(chunkName) || 0
  
  try {
    const result = await importFn()
    
    // Success - reset tracking
    globalRetryAttempts.delete(chunkName)
    permanentlyFailedChunks.delete(chunkName)
    
    return result
  } catch (error) {
    console.warn(`Dynamic import failed for ${chunkName} (attempt ${currentAttempt + 1}):`, error)
    
    // Only retry chunk loading errors
    if (!isChunkLoadError(error)) {
      throw error
    }
    
    // Check if we should retry
    if (currentAttempt >= finalConfig.maxRetries) {
      console.error(`Max retries (${finalConfig.maxRetries}) exceeded for chunk ${chunkName}`)
      
      // Mark as permanently failed
      permanentlyFailedChunks.add(chunkName)
      globalRetryAttempts.delete(chunkName)
      
      throw new Error(
        `Failed to load chunk ${chunkName} after ${finalConfig.maxRetries} attempts. ` +
        'Please refresh the page to try again.'
      )
    }
    
    // Increment attempt counter
    const nextAttempt = currentAttempt + 1
    globalRetryAttempts.set(chunkName, nextAttempt)
    
    // Calculate delay
    const delay = calculateRetryDelay(currentAttempt, finalConfig)
    
    console.log(
      `Retrying chunk ${chunkName} in ${delay}ms (attempt ${nextAttempt}/${finalConfig.maxRetries})`
    )
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Recursive retry
    return retryDynamicImport(importFn, chunkName, config)
  }
}

/**
 * Create a retry wrapper for React.lazy components
 */
export const createRetryableLazy = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  chunkName?: string,
  config?: Partial<RetryConfig>
) => {
  return React.lazy(() => retryDynamicImport(importFn, chunkName, config))
}

/**
 * Preload a chunk with retry logic
 */
export const preloadChunk = async (
  importFn: () => Promise<any>,
  chunkName: string,
  config?: Partial<RetryConfig>
): Promise<boolean> => {
  try {
    await retryDynamicImport(importFn, chunkName, config)
    return true
  } catch (error) {
    console.warn(`Failed to preload chunk ${chunkName}:`, error)
    return false
  }
}

/**
 * Clear retry tracking for a specific chunk or all chunks
 */
export const clearRetryTracking = (chunkName?: string): void => {
  if (chunkName) {
    globalRetryAttempts.delete(chunkName)
    permanentlyFailedChunks.delete(chunkName)
  } else {
    globalRetryAttempts.clear()
    permanentlyFailedChunks.clear()
  }
}

/**
 * Get retry statistics
 */
export const getRetryStats = () => {
  return {
    activeRetries: Array.from(globalRetryAttempts.entries()),
    failedChunks: Array.from(permanentlyFailedChunks),
    totalActiveRetries: globalRetryAttempts.size,
    totalFailedChunks: permanentlyFailedChunks.size,
  }
}

/**
 * Network-aware retry logic
 */
export const isNetworkAvailable = (): boolean => {
  return navigator.onLine
}

/**
 * Wait for network to become available
 */
export const waitForNetwork = (timeout: number = 30000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve(true)
      return
    }
    
    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onlineHandler)
      resolve(false)
    }, timeout)
    
    const onlineHandler = () => {
      clearTimeout(timeoutId)
      window.removeEventListener('online', onlineHandler)
      resolve(true)
    }
    
    window.addEventListener('online', onlineHandler)
  })
}

/**
 * Enhanced retry with network awareness
 */
export const retryWithNetworkCheck = async <T>(
  importFn: () => Promise<T>,
  chunkName: string = `chunk_${Date.now()}`,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  // Check network before attempting
  if (!isNetworkAvailable()) {
    console.warn('Network unavailable, waiting for connection...')
    const networkAvailable = await waitForNetwork()
    
    if (!networkAvailable) {
      throw new Error('Network unavailable - cannot load chunk')
    }
  }
  
  return retryDynamicImport(importFn, chunkName, config)
}

// Export React for createRetryableLazy
import React from 'react'

export default {
  retryDynamicImport,
  createRetryableLazy,
  preloadChunk,
  clearRetryTracking,
  getRetryStats,
  isChunkLoadError,
  retryWithNetworkCheck,
  isNetworkAvailable,
  waitForNetwork,
}