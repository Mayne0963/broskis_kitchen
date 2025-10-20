/**
 * Firestore Error Handler Utility
 * Provides robust error handling and retry logic for Firestore operations
 */

export interface FirestoreErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, retryCount: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export class FirestoreErrorHandler {
  private retryCount = 0;
  private maxRetries: number;
  private retryDelay: number;
  private onError?: (error: Error, retryCount: number) => void;
  private onMaxRetriesReached?: (error: Error) => void;

  constructor(options: FirestoreErrorHandlerOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.onError = options.onError;
    this.onMaxRetriesReached = options.onMaxRetriesReached;
  }

  /**
   * Handle Firestore listener errors with automatic retry logic
   */
  handleListenerError = (error: Error, retryCallback?: () => void): void => {
    // Check if this is a network-related error that should be retried
    const isRetryableError = this.isRetryableError(error);
    
    if (isRetryableError && this.retryCount < this.maxRetries) {
      this.retryCount++;
      
      // Call custom error handler if provided
      this.onError?.(error, this.retryCount);
      
      // Retry after delay
      setTimeout(() => {
        console.log(`Retrying Firestore connection (attempt ${this.retryCount}/${this.maxRetries})`);
        retryCallback?.();
      }, this.retryDelay * this.retryCount); // Exponential backoff
      
    } else {
      // Max retries reached or non-retryable error
      console.error('Firestore listener error (not retrying):', error.message);
      this.onMaxRetriesReached?.(error);
    }
  };

  /**
   * Reset retry count (call when connection is successful)
   */
  reset(): void {
    this.retryCount = 0;
  }

  /**
   * Check if an error is retryable (network-related)
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('unavailable') ||
      message.includes('err_aborted') ||
      message.includes('failed to fetch') ||
      message.includes('webchannel') ||
      error.name === 'NetworkError'
    );
  }
}

/**
 * Create a standardized error handler for Firestore listeners
 */
export function createFirestoreErrorHandler(
  listenerName: string,
  options: FirestoreErrorHandlerOptions = {}
): FirestoreErrorHandler {
  return new FirestoreErrorHandler({
    ...options,
    onError: (error, retryCount) => {
      console.warn(`${listenerName} connection error (retry ${retryCount}):`, error.message);
      options.onError?.(error, retryCount);
    },
    onMaxRetriesReached: (error) => {
      console.error(`${listenerName} failed after ${options.maxRetries ?? 3} retries:`, error.message);
      options.onMaxRetriesReached?.(error);
    }
  });
}

/**
 * Wrapper for onSnapshot with built-in error handling
 */
export function createRobustListener<T>(
  query: any,
  onNext: (snapshot: T) => void,
  listenerName: string,
  options: FirestoreErrorHandlerOptions = {}
): () => void {
  const errorHandler = createFirestoreErrorHandler(listenerName, options);
  let unsubscribe: (() => void) | null = null;

  const setupListener = () => {
    // Import onSnapshot dynamically to avoid SSR issues
    import('firebase/firestore').then(({ onSnapshot }) => {
      unsubscribe = onSnapshot(
        query,
        (snapshot: T) => {
          errorHandler.reset(); // Reset retry count on successful connection
          onNext(snapshot);
        },
        (error: Error) => {
          errorHandler.handleListenerError(error, setupListener);
        }
      );
    }).catch((error) => {
      console.error('Failed to import Firebase:', error);
    });
  };

  // Initial setup
  setupListener();

  // Return cleanup function
  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}