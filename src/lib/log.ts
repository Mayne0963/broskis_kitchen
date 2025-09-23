import { adminDb, Timestamp } from './firebaseAdmin';

export interface ErrorLog {
  source: string;
  message: string;
  stack?: string;
  eventId?: string;
  userId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
  createdAt: FirebaseFirestore.Timestamp;
}

/**
 * Logs errors to Firestore for centralized error tracking
 * @param error - Error object or string message
 * @param context - Additional context for the error
 */
export async function logError(
  error: Error | string,
  context: {
    source: string;
    eventId?: string;
    userId?: string;
    orderId?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const errorLog: ErrorLog = {
      source: context.source,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' && error.stack ? error.stack : undefined,
      eventId: context.eventId,
      userId: context.userId,
      orderId: context.orderId,
      metadata: context.metadata,
      createdAt: Timestamp.now(),
    };

    await adminDb.collection('errorLogs').add(errorLog);
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${context.source}] Error:`, {
        message: errorLog.message,
        stack: errorLog.stack,
        context,
      });
    }
  } catch (loggingError) {
    // Fallback to console if Firestore logging fails
    console.error('Failed to log error to Firestore:', loggingError);
    console.error('Original error:', error);
  }
}

/**
 * Logs info messages to console in development
 * @param message - Info message
 * @param data - Additional data to log
 */
export function logInfo(message: string, data?: any): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[INFO] ${message}`, data || '');
  }
}

/**
 * Logs debug messages to console in development
 * @param message - Debug message
 * @param data - Additional data to log
 */
export function logDebug(message: string, data?: any): void {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[DEBUG] ${message}`, data || '');
  }
}