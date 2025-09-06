'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

interface ChunkErrorHandlerProps {
  children?: React.ReactNode
}

// Enhanced chunk error handler with retry logic
class ChunkLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChunkLoadError'
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  exponentialBackoff: true,
}

// Track failed chunks to avoid infinite retries
const failedChunks = new Set<string>()
const retryAttempts = new Map<string, number>()

// Enhanced dynamic import with retry logic
export const retryDynamicImport = async <T>(
  importFn: () => Promise<T>,
  chunkName: string = 'unknown',
  maxRetries: number = RETRY_CONFIG.maxRetries
): Promise<T> => {
  const attemptCount = retryAttempts.get(chunkName) || 0
  
  try {
    const result = await importFn()
    // Reset retry count on success
    retryAttempts.delete(chunkName)
    failedChunks.delete(chunkName)
    return result
  } catch (error) {
    console.warn(`Chunk loading failed for ${chunkName}:`, error)
    
    // Check if this is a chunk loading error
    const isChunkError = 
      error instanceof Error &&
      (error.message.includes('Loading chunk') ||
       error.message.includes('ChunkLoadError') ||
       error.message.includes('Loading CSS chunk') ||
       error.name === 'ChunkLoadError')
    
    if (isChunkError && attemptCount < maxRetries) {
      const newAttemptCount = attemptCount + 1
      retryAttempts.set(chunkName, newAttemptCount)
      
      // Calculate delay with exponential backoff
      const delay = RETRY_CONFIG.exponentialBackoff
        ? RETRY_CONFIG.retryDelay * Math.pow(2, attemptCount)
        : RETRY_CONFIG.retryDelay
      
      console.log(`Retrying chunk ${chunkName} (attempt ${newAttemptCount}/${maxRetries}) after ${delay}ms`)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Retry the import
      return retryDynamicImport(importFn, chunkName, maxRetries)
    } else {
      // Mark chunk as permanently failed
      failedChunks.add(chunkName)
      retryAttempts.delete(chunkName)
      
      // Show user-friendly error message
      if (isChunkError) {
        toast.error('Failed to load application resources. Please refresh the page.', {
          duration: 5000,
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload(),
          },
        })
      }
      
      throw error
    }
  }
}

// Global error handler for unhandled chunk errors
const handleGlobalChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
  const error = 'error' in event ? event.error : event.reason
  
  if (error instanceof Error) {
    const isChunkError = 
      error.message.includes('Loading chunk') ||
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading CSS chunk')
    
    if (isChunkError) {
      console.error('Global chunk loading error detected:', error)
      
      // Prevent default error handling
      event.preventDefault()
      
      // Show user-friendly error with recovery options
      toast.error('Application update detected. Please refresh to continue.', {
        duration: 10000,
        action: {
          label: 'Refresh Now',
          onClick: () => {
            // Clear cache and reload
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name))
              }).finally(() => {
                window.location.reload()
              })
            } else {
              window.location.reload()
            }
          },
        },
      })
      
      return true // Indicate error was handled
    }
  }
  
  return false
}

// Service worker registration for offline support
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              toast.info('New version available!', {
                duration: 10000,
                action: {
                  label: 'Update',
                  onClick: () => window.location.reload(),
                },
              })
            }
          })
        }
      })
    } catch (error) {
      console.warn('Service Worker registration failed:', error)
    }
  }
}

export default function ChunkErrorHandler({ children }: ChunkErrorHandlerProps) {
  useEffect(() => {
    // Register global error handlers
    const errorHandler = (event: ErrorEvent) => {
      handleGlobalChunkError(event)
    }
    
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      handleGlobalChunkError(event)
    }
    
    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', rejectionHandler)
    
    // Register service worker
    registerServiceWorker()
    
    // Cleanup
    return () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])
  
  return <>{children}</>
}

// Export utility functions
export { ChunkLoadError, failedChunks, retryAttempts }

// Enhanced error boundary hook for chunk errors
export const useChunkErrorRecovery = () => {
  const recoverFromChunkError = () => {
    // Clear failed chunks tracking
    failedChunks.clear()
    retryAttempts.clear()
    
    // Clear browser cache if possible
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
    }
    
    // Reload the page
    window.location.reload()
  }
  
  return { recoverFromChunkError }
}