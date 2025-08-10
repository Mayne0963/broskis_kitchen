import { db } from '@/lib/firebaseAdmin';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  id?: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  source: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  tags?: string[];
  environment: string;
  version?: string;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFirebase: boolean;
  enableFile: boolean;
  maxLogsInMemory: number;
  flushInterval: number;
  includeStack: boolean;
  sensitiveFields: string[];
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: process.env.NODE_ENV === 'development',
      enableFirebase: process.env.NODE_ENV === 'production',
      enableFile: false,
      maxLogsInMemory: 100,
      flushInterval: 10000, // 10 seconds
      includeStack: true,
      sensitiveFields: ['password', 'token', 'apiKey', 'secret', 'creditCard'],
      ...config
    };

    // Start periodic flushing
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.level];
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (this.config.sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    source?: string
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      source: source || 'application',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    };

    if (metadata) {
      entry.metadata = this.sanitizeData(metadata);
    }

    if (this.config.includeStack && (level === 'error' || level === 'fatal')) {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  private async writeLog(entry: LogEntry) {
    // Console logging
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    // Add to memory buffer
    this.logs.push(entry);

    // Flush if buffer is full
    if (this.logs.length >= this.config.maxLogsInMemory) {
      await this.flush();
    }
  }

  private writeToConsole(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.metadata || '');
        break;
      case 'info':
        console.info(message, entry.metadata || '');
        break;
      case 'warn':
        console.warn(message, entry.metadata || '');
        break;
      case 'error':
      case 'fatal':
        console.error(message, entry.metadata || '', entry.stack || '');
        break;
    }
  }

  private async flush() {
    if (this.logs.length === 0) return;

    const logsToFlush = [...this.logs];
    this.logs = [];

    // Write to Firebase
    if (this.config.enableFirebase) {
      try {
        const batch = db.batch();
        logsToFlush.forEach(log => {
          const docRef = db.collection('application_logs').doc();
          batch.set(docRef, log);
        });
        await batch.commit();
      } catch (error) {
        console.error('Failed to write logs to Firebase:', error);
        // Put logs back if write failed
        this.logs.unshift(...logsToFlush);
      }
    }

    // Write to file (if enabled)
    if (this.config.enableFile) {
      try {
        await this.writeToFile(logsToFlush);
      } catch (error) {
        console.error('Failed to write logs to file:', error);
      }
    }
  }

  private async writeToFile(logs: LogEntry[]) {
    // File logging implementation would go here
    // This is a placeholder for file system logging
    const { promises: fs } = await import('fs');
    const path = await import('path');
    
    try {
      const logDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logDir, { recursive: true });
      
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `app-${today}.log`);
      
      const logLines = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
      await fs.appendFile(logFile, logLines);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  // Public logging methods
  debug(message: string, metadata?: Record<string, any>, source?: string) {
    if (!this.shouldLog('debug')) return;
    const entry = this.createLogEntry('debug', message, metadata, source);
    this.writeLog(entry);
  }

  info(message: string, metadata?: Record<string, any>, source?: string) {
    if (!this.shouldLog('info')) return;
    const entry = this.createLogEntry('info', message, metadata, source);
    this.writeLog(entry);
  }

  warn(message: string, metadata?: Record<string, any>, source?: string) {
    if (!this.shouldLog('warn')) return;
    const entry = this.createLogEntry('warn', message, metadata, source);
    this.writeLog(entry);
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>, source?: string) {
    if (!this.shouldLog('error')) return;
    
    const enhancedMetadata = { ...metadata };
    if (error) {
      if (error instanceof Error) {
        enhancedMetadata.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else {
        enhancedMetadata.error = error;
      }
    }
    
    const entry = this.createLogEntry('error', message, enhancedMetadata, source);
    this.writeLog(entry);
  }

  fatal(message: string, error?: Error | any, metadata?: Record<string, any>, source?: string) {
    if (!this.shouldLog('fatal')) return;
    
    const enhancedMetadata = { ...metadata };
    if (error) {
      if (error instanceof Error) {
        enhancedMetadata.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else {
        enhancedMetadata.error = error;
      }
    }
    
    const entry = this.createLogEntry('fatal', message, enhancedMetadata, source);
    this.writeLog(entry);
  }

  // Structured logging methods
  logRequest(request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    userId?: string;
    requestId?: string;
  }) {
    this.info('HTTP Request', {
      type: 'http_request',
      method: request.method,
      url: request.url,
      headers: this.sanitizeData(request.headers),
      body: this.sanitizeData(request.body),
      userId: request.userId,
      requestId: request.requestId
    }, 'http');
  }

  logResponse(response: {
    statusCode: number;
    duration: number;
    size?: number;
    requestId?: string;
  }) {
    this.info('HTTP Response', {
      type: 'http_response',
      statusCode: response.statusCode,
      duration: response.duration,
      size: response.size,
      requestId: response.requestId
    }, 'http');
  }

  logDatabaseQuery(query: {
    collection: string;
    operation: string;
    duration: number;
    resultCount?: number;
    error?: Error;
  }) {
    const level = query.error ? 'error' : 'debug';
    const message = `Database ${query.operation} on ${query.collection}`;
    
    this[level](message, {
      type: 'database_query',
      collection: query.collection,
      operation: query.operation,
      duration: query.duration,
      resultCount: query.resultCount,
      error: query.error
    }, 'database');
  }

  logExternalAPI(api: {
    service: string;
    endpoint: string;
    method: string;
    duration: number;
    statusCode?: number;
    error?: Error;
  }) {
    const level = api.error || (api.statusCode && api.statusCode >= 400) ? 'error' : 'info';
    const message = `External API call to ${api.service}`;
    
    this[level](message, {
      type: 'external_api',
      service: api.service,
      endpoint: api.endpoint,
      method: api.method,
      duration: api.duration,
      statusCode: api.statusCode,
      error: api.error
    }, 'external_api');
  }

  logBusinessEvent(event: {
    type: string;
    action: string;
    userId?: string;
    entityId?: string;
    entityType?: string;
    metadata?: Record<string, any>;
  }) {
    this.info(`Business Event: ${event.type}`, {
      type: 'business_event',
      action: event.action,
      userId: event.userId,
      entityId: event.entityId,
      entityType: event.entityType,
      ...event.metadata
    }, 'business');
  }

  logSecurity(event: {
    type: 'authentication' | 'authorization' | 'suspicious_activity' | 'data_access';
    action: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    success: boolean;
    metadata?: Record<string, any>;
  }) {
    const level = event.success ? 'info' : 'warn';
    const message = `Security Event: ${event.type} - ${event.action}`;
    
    this[level](message, {
      type: 'security_event',
      securityType: event.type,
      action: event.action,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success,
      ...event.metadata
    }, 'security');
  }

  // Context methods
  withContext(context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    tags?: string[];
  }) {
    return {
      debug: (message: string, metadata?: Record<string, any>, source?: string) => {
        this.debug(message, { ...metadata, ...context }, source);
      },
      info: (message: string, metadata?: Record<string, any>, source?: string) => {
        this.info(message, { ...metadata, ...context }, source);
      },
      warn: (message: string, metadata?: Record<string, any>, source?: string) => {
        this.warn(message, { ...metadata, ...context }, source);
      },
      error: (message: string, error?: Error | any, metadata?: Record<string, any>, source?: string) => {
        this.error(message, error, { ...metadata, ...context }, source);
      },
      fatal: (message: string, error?: Error | any, metadata?: Record<string, any>, source?: string) => {
        this.fatal(message, error, { ...metadata, ...context }, source);
      }
    };
  }

  // Query logs
  async queryLogs(filters: {
    level?: LogLevel;
    source?: string;
    userId?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
    tags?: string[];
  }): Promise<LogEntry[]> {
    try {
      let query = db.collection('application_logs') as any;

      if (filters.level) {
        query = query.where('level', '==', filters.level);
      }
      if (filters.source) {
        query = query.where('source', '==', filters.source);
      }
      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }
      if (filters.startTime) {
        query = query.where('timestamp', '>=', filters.startTime);
      }
      if (filters.endTime) {
        query = query.where('timestamp', '<=', filters.endTime);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.where('tags', 'array-contains-any', filters.tags);
      }

      query = query.orderBy('timestamp', 'desc');
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error querying logs:', error);
      return [];
    }
  }

  // Get log statistics
  async getLogStats(timeRange: {
    start: string;
    end: string;
  }): Promise<{
    totalLogs: number;
    levelDistribution: Record<LogLevel, number>;
    sourceDistribution: Record<string, number>;
    errorRate: number;
    topErrors: Array<{ message: string; count: number }>;
  }> {
    try {
      const logs = await this.queryLogs({
        startTime: timeRange.start,
        endTime: timeRange.end,
        limit: 10000
      });

      const stats = {
        totalLogs: logs.length,
        levelDistribution: {} as Record<LogLevel, number>,
        sourceDistribution: {} as Record<string, number>,
        errorRate: 0,
        topErrors: [] as Array<{ message: string; count: number }>
      };

      const errorMessages = new Map<string, number>();
      let errorCount = 0;

      logs.forEach(log => {
        // Level distribution
        stats.levelDistribution[log.level] = (stats.levelDistribution[log.level] || 0) + 1;
        
        // Source distribution
        stats.sourceDistribution[log.source] = (stats.sourceDistribution[log.source] || 0) + 1;
        
        // Error tracking
        if (log.level === 'error' || log.level === 'fatal') {
          errorCount++;
          const count = errorMessages.get(log.message) || 0;
          errorMessages.set(log.message, count + 1);
        }
      });

      stats.errorRate = logs.length > 0 ? (errorCount / logs.length) * 100 : 0;
      
      stats.topErrors = Array.from(errorMessages.entries())
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return stats;
    } catch (error) {
      console.error('Error getting log stats:', error);
      throw error;
    }
  }

  // Cleanup
  async destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Export types
export { LogLevel, LogEntry, LoggerConfig };

// Logging middleware for API routes
export function withLogging<T extends any[]>(
  handler: (request: Request, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log request
    logger.logRequest({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      requestId
    });

    let response: Response;
    try {
      response = await handler(request, ...args);
    } catch (error) {
      logger.error('Request handler error', error, { requestId });
      throw error;
    }

    // Log response
    const duration = Date.now() - startTime;
    logger.logResponse({
      statusCode: response.status,
      duration,
      requestId
    });

    return response;
  };
}

// Logging decorator
export function logged(source?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logSource = source || `${target.constructor.name}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      logger.debug(`Entering ${logSource}`, { args: args.length }, logSource);
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        logger.debug(`Exiting ${logSource}`, { duration }, logSource);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error(`Error in ${logSource}`, error, { duration, args: args.length }, logSource);
        throw error;
      }
    };
    
    return descriptor;
  };
}