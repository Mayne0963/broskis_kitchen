/**
 * Utility for handling dynamic imports with retry logic and error handling
 * Helps prevent ChunkLoadError by implementing retry mechanisms
 */

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
}

/**
 * Wraps a dynamic import with retry logic
 * @param importFn - Function that returns a dynamic import promise
 * @param options - Retry configuration options
 * @returns Promise that resolves to the imported module
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;
  
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;
      
      // Log the error for debugging
      console.warn(`Dynamic import failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with optional exponential backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt) : delay;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  // If all retries failed, throw the last error
  throw new Error(`Dynamic import failed after ${maxRetries + 1} attempts: ${lastError.message}`);
}

/**
 * Creates a retry wrapper for a specific dynamic import using Next.js dynamic()
 * @param importFn - Static import function
 * @param options - Retry configuration options
 * @returns Function that returns the import promise with retry logic
 */
export function createRetryImport<T>(
  importFn: () => Promise<T>,
  options: RetryOptions = {}
) {
  return () => dynamicImportWithRetry<T>(importFn, options);
}

/**
 * Preloads a module with retry logic
 * Useful for critical modules that should be loaded early
 * @param importFn - Function that returns a dynamic import promise
 * @param options - Retry configuration options
 */
export async function preloadWithRetry<T>(
  importFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<void> {
  try {
    await dynamicImportWithRetry(importFn, options);
    console.log('Module preloaded successfully');
  } catch (error) {
    console.error('Failed to preload module:', error);
    // Don't throw here as preloading is optional
  }
}

/**
 * Handles chunk loading errors specifically
 * @param error - The error that occurred
 * @returns boolean indicating if this was a chunk loading error
 */
export function isChunkLoadError(error: Error): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  return (
    error.name === 'ChunkLoadError' ||
    (error.message && error.message.includes('Loading chunk')) ||
    (error.message && error.message.includes('Loading CSS chunk')) ||
    (error.message && error.message.includes('Failed to fetch dynamically imported module'))
  );
}

/**
 * Global error handler for chunk loading errors
 * Can be used to automatically reload the page when chunk errors occur
 */
export function setupChunkErrorHandler(): void {
  if (typeof window !== 'undefined') {
    // Store a flag to prevent multiple reloads in quick succession
    let reloadPending = false;
    let reloadTimeout: NodeJS.Timeout | null = null;
    let errorCount = 0;
    const MAX_ERRORS = 3; // Only reload after multiple chunk errors
    
    const handleChunkError = (error: Error) => {
      if (isChunkLoadError(error) && !reloadPending) {
        errorCount++;
        console.warn(`Chunk loading error detected (${errorCount}/${MAX_ERRORS}):`, error);
        
        // Only reload after multiple chunk errors to prevent excessive reloads
        if (errorCount >= MAX_ERRORS) {
          reloadPending = true;
          
          // Clear any existing timeout to debounce multiple errors
          if (reloadTimeout) {
            clearTimeout(reloadTimeout);
          }
          
          // Debounced auto-reload only after multiple chunk errors
          console.log('Multiple chunk errors detected - auto-reloading in 3 seconds...');
          reloadTimeout = setTimeout(() => {
            console.log('Auto-reloading page to recover from chunk errors');
            window.location.reload();
          }, 3000);
        }
      }
    };
    
    // Reset error count after successful operations
    const resetErrorCount = () => {
      if (errorCount > 0) {
        console.log('Resetting chunk error count after successful operation');
        errorCount = 0;
      }
    };
    
    window.addEventListener('error', (event) => {
      if (event.error) {
        handleChunkError(event.error);
      } else {
        resetErrorCount();
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && isChunkLoadError(event.reason)) {
        handleChunkError(event.reason);
        event.preventDefault();
      }
    });
    
    // Reset error count on successful navigation
    window.addEventListener('beforeunload', resetErrorCount);
    
    console.log('Optimized chunk error handler initialized');
  }
}