import { NextRequest, NextResponse } from 'next/server';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';
  
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';
  
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends Error {
  statusCode = 502;
  code = 'EXTERNAL_SERVICE_ERROR';
  
  constructor(service: string, originalError?: Error) {
    super(`External service error: ${service}`);
    this.name = 'ExternalServiceError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

// Error logging service
class ErrorLogger {
  static async logError(error: Error, context: {
    requestId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
    body?: any;
    query?: any;
  }) {
    try {
      const errorLog = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        statusCode: (error as ApiError).statusCode || 500,
        code: (error as ApiError).code || 'INTERNAL_ERROR',
        context,
        timestamp: new Date().toISOString(),
        severity: this.getSeverity(error)
      };

      // Log to Firebase via API route
      try {
        const response = await fetch('/api/error-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorLog),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
      } catch (apiError) {
        console.error('Failed to log error to API:', apiError);
      }

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', errorLog);
      }

      // Send to external monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        await this.sendToMonitoring(errorLog);
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  private static getSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const statusCode = (error as ApiError).statusCode || 500;
    
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'medium';
    return 'low';
  }

  private static async sendToMonitoring(errorLog: any) {
    // Integrate with monitoring services like Sentry, DataDog, etc.
    // This is a placeholder for external monitoring integration
    try {
      // Example: await sentry.captureException(errorLog);
      console.log('Would send to monitoring service:', errorLog.message);
    } catch (error) {
      console.error('Failed to send to monitoring service:', error);
    }
  }
}

// Request context for error tracking
export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
}

// Enhanced error handler with context
export function withErrorHandler<T extends any[]>(
  handler: (request: NextRequest, context: RequestContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    const context: RequestContext = {
      requestId,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      startTime
    };

    try {
      // Extract user context if authenticated
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.split('Bearer ')[1];
          const response = await fetch('/api/error-logs', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              context.userId = data.user.uid;
              context.userRole = data.user.claims?.role || 'user';
            }
          }
        } catch (authError) {
          // Don't fail the request if token verification fails
          // Let the handler decide how to handle authentication
        }
      }

      const response = await handler(request, context, ...args);
      
      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        const duration = Date.now() - startTime;
        console.log(`${context.method} ${context.endpoint} - ${response.status} (${duration}ms)`);
      }
      
      return response;
    } catch (error) {
      return await handleError(error as Error, context, request);
    }
  };
}

// Main error handling function
export async function handleError(
  error: Error,
  context: RequestContext,
  request: NextRequest
): Promise<NextResponse> {
  const duration = Date.now() - context.startTime;
  
  // Enhanced context for logging
  const enhancedContext = {
    ...context,
    duration,
    body: await safeGetRequestBody(request),
    query: Object.fromEntries(request.nextUrl.searchParams.entries())
  };

  // Log the error
  await ErrorLogger.logError(error, enhancedContext);

  // Determine response based on error type
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        field: error.field,
        requestId: context.requestId
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId: context.requestId
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId: context.requestId
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId: context.requestId
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId: context.requestId
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId: context.requestId,
        retryAfter: 60 // seconds
      },
      { 
        status: error.statusCode,
        headers: {
          'Retry-After': '60'
        }
      }
    );
  }

  if (error instanceof ExternalServiceError) {
    return NextResponse.json(
      {
        error: 'External service temporarily unavailable',
        code: error.code,
        requestId: context.requestId
      },
      { status: error.statusCode }
    );
  }

  // Handle Firebase-specific errors
  if (error.message.includes('Firebase ID token')) {
    return NextResponse.json(
      {
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        requestId: context.requestId
      },
      { status: 401 }
    );
  }

  // Handle Stripe-specific errors
  if (error.message.includes('Stripe')) {
    return NextResponse.json(
      {
        error: 'Payment processing error',
        code: 'PAYMENT_ERROR',
        requestId: context.requestId
      },
      { status: 502 }
    );
  }

  // Generic server error
  return NextResponse.json(
    {
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId: context.requestId
    },
    { status: 500 }
  );
}

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function safeGetRequestBody(request: NextRequest): Promise<any> {
  try {
    // Clone the request to avoid consuming the body
    const clonedRequest = request.clone();
    const contentType = clonedRequest.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await clonedRequest.json();
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await clonedRequest.formData();
      return Object.fromEntries(formData.entries());
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Validation helpers
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

export function validateEmail(email: string, fieldName: string = 'email'): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }
}

export function validatePhone(phone: string, fieldName: string = 'phone'): void {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }
}

export function validateEnum<T extends string>(
  value: string,
  validValues: T[],
  fieldName: string
): void {
  if (!validValues.includes(value as T)) {
    throw new ValidationError(
      `Invalid ${fieldName}. Must be one of: ${validValues.join(', ')}`,
      fieldName
    );
  }
}

export function validatePositiveNumber(value: number, fieldName: string): void {
  if (typeof value !== 'number' || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`, fieldName);
  }
}

export function validateArrayNotEmpty<T>(array: T[], fieldName: string): void {
  if (!Array.isArray(array) || array.length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty array`, fieldName);
  }
}

// Authentication helper
export async function requireAuth(request: NextRequest): Promise<{
  uid: string;
  email?: string;
  claims?: { admin?: boolean; role?: string; kitchen?: boolean };
}> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid authorization header');
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const response = await fetch('/api/error-logs', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      throw new AuthenticationError('Invalid authentication token');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new AuthenticationError('Invalid authentication token');
    }
    
    return {
      uid: data.user.uid,
      email: data.user.email,
      claims: {
        admin: data.user.claims?.admin,
        role: data.user.claims?.role,
        kitchen: data.user.claims?.kitchen
      }
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Invalid authentication token');
  }
}

// Authorization helpers
export function requireAdmin(user: { claims?: { admin?: boolean } }): void {
  if (!user.claims?.admin) {
    throw new AuthorizationError('Admin access required');
  }
}

export function requireRole(user: { claims?: { role?: string } }, requiredRole: string): void {
  if (user.claims?.role !== requiredRole) {
    throw new AuthorizationError(`${requiredRole} role required`);
  }
}

export function requireOwnershipOrAdmin(
  user: { uid: string; claims?: { admin?: boolean } },
  resourceOwnerId: string
): void {
  if (!user.claims?.admin && user.uid !== resourceOwnerId) {
    throw new AuthorizationError('Access denied. You can only access your own resources');
  }
}