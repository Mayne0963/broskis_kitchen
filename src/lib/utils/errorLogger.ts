// Error logging utility for development and production

interface ErrorDetails {
  message: string;
  stack?: string;
  digest?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  environment: string;
}

export function logError(error: Error, additionalInfo?: Record<string, any>) {
  const errorDetails: ErrorDetails = {
    message: error.message,
    stack: error.stack,
    digest: (error as any).digest || 'No digest available',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Server-side',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side',
    ...additionalInfo
  };

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Details');
    console.error('Message:', errorDetails.message);
    console.error('Digest:', errorDetails.digest);
    console.error('Environment:', errorDetails.environment);
    console.error('URL:', errorDetails.url);
    if (errorDetails.stack) {
      console.error('Stack:', errorDetails.stack);
    }
    if (errorDetails.componentStack) {
      console.error('Component Stack:', errorDetails.componentStack);
    }
    if (additionalInfo) {
      console.error('Additional Info:', additionalInfo);
    }
    console.groupEnd();
  }

  // In production, you might want to send to an error monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, LogRocket, or custom endpoint
    // sendToErrorService(errorDetails);

    // Log a concise production error to avoid generic [object Object] output
    const { message, digest, timestamp } = errorDetails
    console.error(
      `Production Error: ${message} (digest: ${digest}, timestamp: ${timestamp})`
    )
  }

  return errorDetails;
}

export function createErrorHandler(context: string) {
  return (error: Error, additionalInfo?: Record<string, any>) => {
    return logError(error, {
      context,
      ...additionalInfo
    });
  };
}

// Server-side error handler for API routes and Server Components
export function handleServerError(error: Error, context: string) {
  const errorDetails = logError(error, { context, serverSide: true });
  
  // Return a safe error response for production
  if (process.env.NODE_ENV === 'production') {
    return {
      error: 'Internal Server Error',
      digest: errorDetails.digest,
      timestamp: errorDetails.timestamp
    };
  }
  
  // Return full details in development
  return errorDetails;
}

// Client-side error handler
export function handleClientError(error: Error, context: string) {
  return logError(error, { context, clientSide: true });
}