export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getAdminDb } from '@/lib/firebase/admin';

interface PerformanceMetric {
  id?: string;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  requestSize?: number;
  responseSize?: number;
  memoryUsage?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
  errorMessage?: string;
  tags?: string[];
}

interface SystemHealth {
  timestamp: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  uptime: number;
  loadAverage?: number[];
  activeConnections?: number;
  responseTime?: number;
}

interface AlertRule {
  id: string;
  name: string;
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    timeWindow: number; // in milliseconds
  };
  actions: {
    type: 'email' | 'sms' | 'webhook';
    target: string;
    message?: string;
  }[];
  enabled: boolean;
  cooldown: number; // minimum time between alerts in milliseconds
  lastTriggered?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetricsInMemory = 1000;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout;
  private alertRules: AlertRule[] = [];
  private systemHealthInterval: NodeJS.Timeout;
  private startTime = Date.now();

  constructor() {
    // Start periodic flushing of metrics
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);

    // Start system health monitoring
    this.systemHealthInterval = setInterval(() => {
      this.collectSystemHealth();
    }, 60000); // Every minute

    // Initialize default alert rules
    this.initializeDefaultAlerts();
  }

  // Record a performance metric
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'memoryUsage' | 'cpuUsage'>) {
    const now = new Date().toISOString();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: now,
      memoryUsage: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    };

    this.metrics.push(fullMetric);

    // Check if we need to flush metrics
    if (this.metrics.length >= this.maxMetricsInMemory) {
      this.flushMetrics();
    }

    // Check alert rules
    this.checkAlerts(fullMetric);
  }

  // Flush metrics to database
  private async flushMetrics() {
    if (this.metrics.length === 0) return;

    try {
      const adminDb = getAdminDb('admin');
      const batch = adminDb.batch();
      const metricsToFlush = [...this.metrics];
      this.metrics = [];

      metricsToFlush.forEach(metric => {
        const docRef = adminDb.collection('performance_metrics').doc();
        batch.set(docRef, metric);
      });

      await batch.commit();
      console.log(`Flushed ${metricsToFlush.length} performance metrics`);
    } catch (error) {
      console.error('Error flushing performance metrics:', error);
      // Put metrics back if flush failed
      this.metrics.unshift(...this.metrics);
    }
  }

  // Collect system health metrics
  private async collectSystemHealth() {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();

      const healthMetric: SystemHealth = {
        timestamp: new Date().toISOString(),
        memoryUsage: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers || 0
        },
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime
      };

      // Add load average on Unix systems
      if (process.platform !== 'win32') {
        try {
          const os = await import('os');
          healthMetric.loadAverage = os.loadavg();
        } catch (error) {
          // Ignore if os module is not available
        }
      }

      const adminDb = getAdminDb('admin');
      await adminDb.collection('system_health').add(healthMetric);
    } catch (error) {
      console.error('Error collecting system health:', error);
    }
  }

  // Initialize default alert rules
  private initializeDefaultAlerts() {
    this.alertRules = [
      {
        id: 'high_response_time',
        name: 'High Response Time',
        condition: {
          metric: 'duration',
          operator: '>',
          threshold: 5000, // 5 seconds
          timeWindow: 5 * 60 * 1000 // 5 minutes
        },
        actions: [
          {
            type: 'email',
            target: process.env.ALERT_EMAIL || 'admin@example.com',
            message: 'API response time is above 5 seconds'
          }
        ],
        enabled: true,
        cooldown: 15 * 60 * 1000 // 15 minutes
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: {
          metric: 'statusCode',
          operator: '>=',
          threshold: 500,
          timeWindow: 5 * 60 * 1000
        },
        actions: [
          {
            type: 'email',
            target: process.env.ALERT_EMAIL || 'admin@example.com',
            message: 'High error rate detected'
          }
        ],
        enabled: true,
        cooldown: 10 * 60 * 1000 // 10 minutes
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: {
          metric: 'memoryUsage.heapUsed',
          operator: '>',
          threshold: 500 * 1024 * 1024, // 500MB
          timeWindow: 2 * 60 * 1000 // 2 minutes
        },
        actions: [
          {
            type: 'email',
            target: process.env.ALERT_EMAIL || 'admin@example.com',
            message: 'Memory usage is above 500MB'
          }
        ],
        enabled: true,
        cooldown: 20 * 60 * 1000 // 20 minutes
      }
    ];
  }

  // Check alert rules against a metric
  private async checkAlerts(metric: PerformanceMetric) {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastAlert = Date.now() - new Date(rule.lastTriggered).getTime();
        if (timeSinceLastAlert < rule.cooldown) {
          continue;
        }
      }

      const shouldTrigger = await this.evaluateAlertCondition(rule, metric);
      if (shouldTrigger) {
        await this.triggerAlert(rule, metric);
      }
    }
  }

  // Evaluate if an alert condition is met
  private async evaluateAlertCondition(rule: AlertRule, metric: PerformanceMetric): Promise<boolean> {
    const { condition } = rule;
    let value: number;

    // Extract the metric value
    switch (condition.metric) {
      case 'duration':
        value = metric.duration;
        break;
      case 'statusCode':
        value = metric.statusCode;
        break;
      case 'memoryUsage.heapUsed':
        value = metric.memoryUsage?.heapUsed || 0;
        break;
      case 'memoryUsage.rss':
        value = metric.memoryUsage?.rss || 0;
        break;
      case 'cpuUsage.user':
        value = metric.cpuUsage?.user || 0;
        break;
      default:
        return false;
    }

    // Evaluate condition
    switch (condition.operator) {
      case '>':
        return value > condition.threshold;
      case '<':
        return value < condition.threshold;
      case '>=':
        return value >= condition.threshold;
      case '<=':
        return value <= condition.threshold;
      case '==':
        return value === condition.threshold;
      case '!=':
        return value !== condition.threshold;
      default:
        return false;
    }
  }

  // Trigger an alert
  private async triggerAlert(rule: AlertRule, metric: PerformanceMetric) {
    try {
      const alertData = {
        ruleId: rule.id,
        ruleName: rule.name,
        metric,
        timestamp: new Date().toISOString(),
        severity: this.getAlertSeverity(rule),
        resolved: false
      };

      // Save alert to database
      await db.collection('alerts').add(alertData);

      // Execute alert actions
      for (const action of rule.actions) {
        await this.executeAlertAction(action, rule, metric);
      }

      // Update last triggered time
      rule.lastTriggered = new Date().toISOString();

      console.log(`Alert triggered: ${rule.name}`);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  // Execute an alert action
  private async executeAlertAction(
    action: AlertRule['actions'][0],
    rule: AlertRule,
    metric: PerformanceMetric
  ) {
    try {
      switch (action.type) {
        case 'email':
          // Integrate with email service
          console.log(`Would send email alert to ${action.target}: ${action.message}`);
          break;
        case 'sms':
          // Integrate with SMS service
          console.log(`Would send SMS alert to ${action.target}: ${action.message}`);
          break;
        case 'webhook':
          // Send webhook
          const webhookData = {
            rule: rule.name,
            metric,
            message: action.message,
            timestamp: new Date().toISOString()
          };
          
          try {
            const response = await fetch(action.target, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(webhookData)
            });
            
            if (!response.ok) {
              console.error(`Webhook failed: ${response.status}`);
            }
          } catch (webhookError) {
            console.error('Webhook error:', webhookError);
          }
          break;
      }
    } catch (error) {
      console.error('Error executing alert action:', error);
    }
  }

  // Get alert severity based on rule
  private getAlertSeverity(rule: AlertRule): 'low' | 'medium' | 'high' | 'critical' {
    if (rule.id.includes('error') || rule.id.includes('critical')) {
      return 'critical';
    }
    if (rule.id.includes('high') || rule.id.includes('memory')) {
      return 'high';
    }
    if (rule.id.includes('medium') || rule.id.includes('response')) {
      return 'medium';
    }
    return 'low';
  }

  // Get performance analytics
  async getAnalytics(timeRange: {
    start: string;
    end: string;
  }): Promise<{
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    slowestEndpoints: Array<{ endpoint: string; averageTime: number }>;
    statusCodeDistribution: Record<string, number>;
    memoryTrend: Array<{ timestamp: string; heapUsed: number }>;
  }> {
    try {
      const metricsSnapshot = await db.collection('performance_metrics')
        .where('timestamp', '>=', timeRange.start)
        .where('timestamp', '<=', timeRange.end)
        .get();

      const metrics = metricsSnapshot.docs.map(doc => doc.data() as PerformanceMetric);

      if (metrics.length === 0) {
        return {
          averageResponseTime: 0,
          totalRequests: 0,
          errorRate: 0,
          slowestEndpoints: [],
          statusCodeDistribution: {},
          memoryTrend: []
        };
      }

      // Calculate average response time
      const totalResponseTime = metrics.reduce((sum, metric) => sum + metric.duration, 0);
      const averageResponseTime = totalResponseTime / metrics.length;

      // Calculate error rate
      const errorCount = metrics.filter(metric => metric.statusCode >= 400).length;
      const errorRate = (errorCount / metrics.length) * 100;

      // Find slowest endpoints
      const endpointTimes = new Map<string, number[]>();
      metrics.forEach(metric => {
        const key = `${metric.method} ${metric.endpoint}`;
        if (!endpointTimes.has(key)) {
          endpointTimes.set(key, []);
        }
        endpointTimes.get(key)!.push(metric.duration);
      });

      const slowestEndpoints = Array.from(endpointTimes.entries())
        .map(([endpoint, times]) => ({
          endpoint,
          averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
        }))
        .sort((a, b) => b.averageTime - a.averageTime)
        .slice(0, 10);

      // Status code distribution
      const statusCodeDistribution: Record<string, number> = {};
      metrics.forEach(metric => {
        const code = metric.statusCode.toString();
        statusCodeDistribution[code] = (statusCodeDistribution[code] || 0) + 1;
      });

      // Memory trend
      const memoryTrend = metrics
        .filter(metric => metric.memoryUsage)
        .map(metric => ({
          timestamp: metric.timestamp,
          heapUsed: metric.memoryUsage!.heapUsed
        }))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return {
        averageResponseTime,
        totalRequests: metrics.length,
        errorRate,
        slowestEndpoints,
        statusCodeDistribution,
        memoryTrend
      };
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw error;
    }
  }

  // Add or update alert rule
  addAlertRule(rule: AlertRule) {
    const existingIndex = this.alertRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.alertRules[existingIndex] = rule;
    } else {
      this.alertRules.push(rule);
    }
  }

  // Remove alert rule
  removeAlertRule(ruleId: string) {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
  }

  // Get current alert rules
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  // Cleanup resources
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (this.systemHealthInterval) {
      clearInterval(this.systemHealthInterval);
    }
    // Flush remaining metrics
    this.flushMetrics();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware for automatic performance tracking
export function withPerformanceTracking<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const startTime = Date.now();
    const request = args[0] as Request;
    
    let response: Response;
    let error: Error | null = null;
    
    try {
      response = await handler(...args);
    } catch (err) {
      error = err as Error;
      response = new Response('Internal Server Error', { status: 500 });
    }
    
    const duration = Date.now() - startTime;
    
    // Record performance metric
    performanceMonitor.recordMetric({
      endpoint: new URL(request.url).pathname,
      method: request.method,
      duration,
      statusCode: response.status,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined,
      requestSize: parseInt(request.headers.get('content-length') || '0'),
      responseSize: parseInt(response.headers.get('content-length') || '0'),
      errorMessage: error?.message,
      tags: error ? ['error'] : ['success']
    });
    
    if (error) {
      throw error;
    }
    
    return response;
  };
}

// Performance tracking decorator
export function trackPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    let error: Error | null = null;
    let result: any;
    
    try {
      result = await method.apply(this, args);
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      performanceMonitor.recordMetric({
        endpoint: `${target.constructor.name}.${propertyName}`,
        method: 'FUNCTION',
        duration,
        statusCode: error ? 500 : 200,
        errorMessage: error?.message,
        tags: [target.constructor.name.toLowerCase(), propertyName]
      });
    }
    
    return result;
  };
  
  return descriptor;
}

export { PerformanceMetric, SystemHealth, AlertRule };
