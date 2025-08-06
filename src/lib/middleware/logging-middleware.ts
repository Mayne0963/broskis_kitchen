import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/services/logging-service';
import { auth } from '@/lib/firebaseAdmin';

interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  startTime: number;
}

// Enhanced logging middleware for production
export function withProductionLogging<T extends any[]>(
  handler: (request: NextRequest, context: RequestContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    const context: RequestContext = {
      requestId,
      startTime,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    };

    // Extract user context if authenticated
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        context.userId = decodedToken.uid;
        context.userRole = decodedToken.role || 'user';
        context.sessionId = decodedToken.session_id;
      }
    } catch (authError) {
      // Don't fail the request if token verification fails
      // The handler will decide how to handle authentication
    }

    // Log incoming request
    const requestBody = await safeGetRequestBody(request);
    logger.logRequest({
      method: request.method,
      url: request.url,
      headers: sanitizeHeaders(request.headers),
      body: requestBody,
      userId: context.userId,
      requestId: context.requestId
    });

    // Log business event for important endpoints
    logBusinessEvent(request, context);

    let response: NextResponse;
    let error: Error | null = null;

    try {
      response = await handler(request, context, ...args);
    } catch (handlerError) {
      error = handlerError as Error;
      
      // Log the error with full context
      logger.error(
        `Request handler error: ${error.message}`,
        error,
        {
          requestId: context.requestId,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          userId: context.userId,
          userAgent: context.userAgent,
          ip: context.ip,
          requestBody: requestBody,
          query: Object.fromEntries(request.nextUrl.searchParams.entries())
        },
        'api'
      );
      
      throw error;
    }

    // Log response
    const duration = Date.now() - startTime;
    logger.logResponse({
      statusCode: response.status,
      duration,
      requestId: context.requestId
    });

    // Log performance metrics
    logPerformanceMetric(request, response, context, duration);

    // Log security events
    logSecurityEvent(request, response, context);

    // Add request ID to response headers for tracing
    response.headers.set('X-Request-ID', context.requestId);
    
    // Add performance headers
    response.headers.set('X-Response-Time', `${duration}ms`);
    
    return response;
  };
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get client IP address
function getClientIP(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || cfConnectingIP || undefined;
}

// Safely extract request body without consuming it
async function safeGetRequestBody(request: NextRequest): Promise<any> {
  try {
    const clonedRequest = request.clone();
    const contentType = clonedRequest.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await clonedRequest.json();
      return sanitizeRequestBody(body);
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await clonedRequest.formData();
      const body = Object.fromEntries(formData.entries());
      return sanitizeRequestBody(body);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Sanitize sensitive data from request body
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = [
    'password', 'token', 'apiKey', 'secret', 'creditCard', 
    'cardNumber', 'cvv', 'ssn', 'socialSecurityNumber'
  ];
  
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Sanitize headers
function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  headers.forEach((value, key) => {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}

// Log business events for important endpoints
function logBusinessEvent(request: NextRequest, context: RequestContext) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  
  // Order-related events
  if (pathname.includes('/orders') && method === 'POST') {
    logger.logBusinessEvent({
      type: 'order_creation_attempt',
      action: 'create_order',
      userId: context.userId,
      entityType: 'order',
      metadata: {
        endpoint: pathname,
        requestId: context.requestId
      }
    });
  }
  
  // Payment-related events
  if (pathname.includes('/payment') || pathname.includes('/stripe')) {
    logger.logBusinessEvent({
      type: 'payment_processing',
      action: method.toLowerCase(),
      userId: context.userId,
      entityType: 'payment',
      metadata: {
        endpoint: pathname,
        requestId: context.requestId
      }
    });
  }
  
  // Authentication events
  if (pathname.includes('/auth') || pathname.includes('/login')) {
    logger.logBusinessEvent({
      type: 'authentication',
      action: method.toLowerCase(),
      userId: context.userId,
      entityType: 'user',
      metadata: {
        endpoint: pathname,
        requestId: context.requestId
      }
    });
  }
}

// Log performance metrics
function logPerformanceMetric(
  request: NextRequest,
  response: NextResponse,
  context: RequestContext,
  duration: number
) {
  // Only log performance metrics for API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    logger.info('API Performance', {
      type: 'performance_metric',
      endpoint: request.nextUrl.pathname,
      method: request.method,
      duration,
      statusCode: response.status,
      userId: context.userId,
      requestId: context.requestId,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }, 'performance');
  }
}

// Log security events
function logSecurityEvent(
  request: NextRequest,
  response: NextResponse,
  context: RequestContext
) {
  const pathname = request.nextUrl.pathname;
  const statusCode = response.status;
  
  // Failed authentication attempts
  if (statusCode === 401) {
    logger.logSecurity({
      type: 'authentication',
      action: 'failed_authentication',
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      success: false,
      metadata: {
        endpoint: pathname,
        method: request.method,
        requestId: context.requestId
      }
    });
  }
  
  // Authorization failures
  if (statusCode === 403) {
    logger.logSecurity({
      type: 'authorization',
      action: 'access_denied',
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      success: false,
      metadata: {
        endpoint: pathname,
        method: request.method,
        requestId: context.requestId
      }
    });
  }
  
  // Successful admin access
  if (pathname.includes('/admin') && statusCode === 200 && context.userId) {
    logger.logSecurity({
      type: 'data_access',
      action: 'admin_access',
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      success: true,
      metadata: {
        endpoint: pathname,
        method: request.method,
        requestId: context.requestId
      }
    });
  }
  
  // Rate limiting
  if (statusCode === 429) {
    logger.logSecurity({
      type: 'suspicious_activity',
      action: 'rate_limit_exceeded',
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      success: false,
      metadata: {
        endpoint: pathname,
        method: request.method,
        requestId: context.requestId
      }
    });
  }
}

// Context logger for use within request handlers
export function getContextLogger(context: RequestContext) {
  return logger.withContext({
    userId: context.userId,
    sessionId: context.sessionId,
    requestId: context.requestId,
    tags: ['api']
  });
}

// Export aliases for backward compatibility
export const withLoggingMiddleware = withProductionLogging;

// Export types
export type { RequestContext };