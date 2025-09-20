import { logger } from './logging-service';
import { safeFetch } from '../utils/safeFetch';

interface Alert {
  id?: string;
  type: 'error_rate' | 'response_time' | 'memory_usage' | 'disk_space' | 'service_down' | 'security_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
  notificationsSent: string[]; // Array of notification types sent
}

interface AlertRule {
  id: string;
  name: string;
  type: Alert['type'];
  enabled: boolean;
  conditions: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    timeWindow: number; // in milliseconds
    consecutiveFailures?: number;
  };
  severity: Alert['severity'];
  notifications: {
    email?: {
      enabled: boolean;
      recipients: string[];
      template?: string;
    };
    webhook?: {
      enabled: boolean;
      url: string;
      headers?: Record<string, string>;
    };
    sms?: {
      enabled: boolean;
      recipients: string[];
    };
  };
  cooldown: number; // minimum time between alerts in milliseconds
  lastTriggered?: string;
}

class AlertService {
  private alertRules: AlertRule[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private metricsBuffer: Map<string, any[]> = new Map();
  private initialized = false;

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default alert rules
  private initializeDefaultRules() {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        type: 'error_rate',
        enabled: true,
        conditions: {
          metric: 'error_rate',
          operator: '>',
          threshold: 5, // 5% error rate
          timeWindow: 5 * 60 * 1000, // 5 minutes
          consecutiveFailures: 3
        },
        severity: 'high',
        notifications: {
          email: {
            enabled: true,
            recipients: [process.env.ALERT_EMAIL || 'admin@broskiskitchen.com']
          },
          webhook: {
            enabled: !!process.env.ALERT_WEBHOOK_URL,
            url: process.env.ALERT_WEBHOOK_URL || ''
          }
        },
        cooldown: 15 * 60 * 1000 // 15 minutes
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        type: 'response_time',
        enabled: true,
        conditions: {
          metric: 'avg_response_time',
          operator: '>',
          threshold: 3000, // 3 seconds
          timeWindow: 10 * 60 * 1000, // 10 minutes
          consecutiveFailures: 5
        },
        severity: 'medium',
        notifications: {
          email: {
            enabled: true,
            recipients: [process.env.ALERT_EMAIL || 'admin@broskiskitchen.com']
          }
        },
        cooldown: 30 * 60 * 1000 // 30 minutes
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        type: 'memory_usage',
        enabled: true,
        conditions: {
          metric: 'memory_usage_percent',
          operator: '>',
          threshold: 85, // 85% memory usage
          timeWindow: 5 * 60 * 1000, // 5 minutes
          consecutiveFailures: 3
        },
        severity: 'high',
        notifications: {
          email: {
            enabled: true,
            recipients: [process.env.ALERT_EMAIL || 'admin@broskiskitchen.com']
          },
          webhook: {
            enabled: !!process.env.ALERT_WEBHOOK_URL,
            url: process.env.ALERT_WEBHOOK_URL || ''
          }
        },
        cooldown: 20 * 60 * 1000 // 20 minutes
      },
      {
        id: 'critical_memory_usage',
        name: 'Critical Memory Usage',
        type: 'memory_usage',
        enabled: true,
        conditions: {
          metric: 'memory_usage_percent',
          operator: '>',
          threshold: 95, // 95% memory usage
          timeWindow: 2 * 60 * 1000, // 2 minutes
          consecutiveFailures: 2
        },
        severity: 'critical',
        notifications: {
          email: {
            enabled: true,
            recipients: [process.env.ALERT_EMAIL || 'admin@broskiskitchen.com']
          },
          webhook: {
            enabled: !!process.env.ALERT_WEBHOOK_URL,
            url: process.env.ALERT_WEBHOOK_URL || ''
          },
          sms: {
            enabled: !!process.env.ALERT_SMS_ENABLED,
            recipients: [process.env.ALERT_PHONE || '']
          }
        },
        cooldown: 10 * 60 * 1000 // 10 minutes
      },
      {
        id: 'service_down',
        name: 'Service Down',
        type: 'service_down',
        enabled: true,
        conditions: {
          metric: 'service_availability',
          operator: '<',
          threshold: 1, // Service not available
          timeWindow: 2 * 60 * 1000, // 2 minutes
          consecutiveFailures: 2
        },
        severity: 'critical',
        notifications: {
          email: {
            enabled: true,
            recipients: [process.env.ALERT_EMAIL || 'admin@broskiskitchen.com']
          },
          webhook: {
            enabled: !!process.env.ALERT_WEBHOOK_URL,
            url: process.env.ALERT_WEBHOOK_URL || ''
          },
          sms: {
            enabled: !!process.env.ALERT_SMS_ENABLED,
            recipients: [process.env.ALERT_PHONE || '']
          }
        },
        cooldown: 5 * 60 * 1000 // 5 minutes
      }
    ];
  }

  // Record a metric for monitoring
  recordMetric(type: string, value: number, metadata?: Record<string, any>) {
    const timestamp = Date.now();
    const metric = {
      value,
      timestamp,
      metadata
    };

    if (!this.metricsBuffer.has(type)) {
      this.metricsBuffer.set(type, []);
    }

    const buffer = this.metricsBuffer.get(type)!;
    buffer.push(metric);

    // Keep only recent metrics (last hour)
    const oneHourAgo = timestamp - (60 * 60 * 1000);
    this.metricsBuffer.set(type, buffer.filter(m => m.timestamp > oneHourAgo));

    // Check alert rules
    this.checkAlertRules(type, value, metadata);
  }

  // Check alert rules against current metrics
  private async checkAlertRules(metricType: string, currentValue: number, metadata?: Record<string, any>) {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check if this rule applies to the current metric
      if (!this.doesRuleApplyToMetric(rule, metricType)) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastAlert = Date.now() - new Date(rule.lastTriggered).getTime();
        if (timeSinceLastAlert < rule.cooldown) continue;
      }

      // Evaluate rule condition
      const shouldTrigger = await this.evaluateRuleCondition(rule, metricType, currentValue);
      
      if (shouldTrigger) {
        await this.triggerAlert(rule, currentValue, metadata);
      }
    }
  }

  // Check if a rule applies to a specific metric type
  private doesRuleApplyToMetric(rule: AlertRule, metricType: string): boolean {
    const metricMappings: Record<string, string[]> = {
      'error_rate': ['error_count', 'request_count'],
      'response_time': ['response_time', 'avg_response_time'],
      'memory_usage': ['memory_usage', 'memory_usage_percent'],
      'service_down': ['service_availability', 'health_check']
    };

    const applicableMetrics = metricMappings[rule.type] || [rule.conditions.metric];
    return applicableMetrics.includes(metricType) || metricType === rule.conditions.metric;
  }

  // Evaluate if a rule condition is met
  private async evaluateRuleCondition(rule: AlertRule, metricType: string, currentValue: number): Promise<boolean> {
    const { conditions } = rule;
    const now = Date.now();
    const windowStart = now - conditions.timeWindow;

    // Get metrics within the time window
    const metrics = this.metricsBuffer.get(metricType) || [];
    const windowMetrics = metrics.filter(m => m.timestamp >= windowStart);

    if (windowMetrics.length === 0) return false;

    // Calculate the metric value based on the rule type
    let metricValue: number;
    
    switch (rule.conditions.metric) {
      case 'error_rate':
        metricValue = await this.calculateErrorRate(windowStart, now);
        break;
      case 'avg_response_time':
        metricValue = windowMetrics.reduce((sum, m) => sum + m.value, 0) / windowMetrics.length;
        break;
      case 'memory_usage_percent':
        metricValue = currentValue;
        break;
      case 'service_availability':
        metricValue = currentValue;
        break;
      default:
        metricValue = currentValue;
    }

    // Check if condition is met
    const conditionMet = this.evaluateCondition(metricValue, conditions.operator, conditions.threshold);
    
    if (!conditionMet) return false;

    // Check consecutive failures if required
    if (conditions.consecutiveFailures && conditions.consecutiveFailures > 1) {
      return await this.checkConsecutiveFailures(rule, metricType, conditions.consecutiveFailures);
    }

    return true;
  }

  // Calculate error rate from recent metrics
  private async calculateErrorRate(startTime: number, endTime: number): Promise<number> {
    try {
      const response = await fetch(`/api/alerts?action=error_rate&startTime=${new Date(startTime).toISOString()}&endTime=${new Date(endTime).toISOString()}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to calculate error rate');
      }
      
      return data.errorRate || 0;
    } catch (error) {
      logger.error('Error calculating error rate for alerts', error);
      return 0;
    }
  }

  // Evaluate a condition
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  // Check consecutive failures
  private async checkConsecutiveFailures(rule: AlertRule, metricType: string, requiredFailures: number): Promise<boolean> {
    // This is a simplified implementation
    // In a production system, you'd want to track failure states more persistently
    const recentMetrics = this.metricsBuffer.get(metricType) || [];
    const lastNMetrics = recentMetrics.slice(-requiredFailures);
    
    if (lastNMetrics.length < requiredFailures) return false;
    
    return lastNMetrics.every(metric => 
      this.evaluateCondition(metric.value, rule.conditions.operator, rule.conditions.threshold)
    );
  }

  // Trigger an alert
  private async triggerAlert(rule: AlertRule, value: number, metadata?: Record<string, any>) {
    const alert: Alert = {
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      message: this.generateAlertMessage(rule, value, metadata),
      timestamp: new Date().toISOString(),
      resolved: false,
      metadata: {
        ruleId: rule.id,
        value,
        threshold: rule.conditions.threshold,
        ...metadata
      },
      notificationsSent: []
    };

    // Save alert to database via API
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alert)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.alertId) {
        alert.id = data.alertId;
        this.activeAlerts.set(alert.id, alert);
      } else {
        throw new Error(data.error || 'Failed to create alert');
      }
    } catch (error) {
      logger.error('Error saving alert to database', error);
    }

    // Send notifications
    await this.sendNotifications(rule, alert);

    // Update rule's last triggered time
    rule.lastTriggered = alert.timestamp;

    // Log the alert
    logger.warn(`Alert triggered: ${alert.title}`, {
      alertId: alert.id,
      severity: alert.severity,
      value,
      threshold: rule.conditions.threshold,
      metadata
    }, 'alerts');
  }

  // Generate alert message
  private generateAlertMessage(rule: AlertRule, value: number, metadata?: Record<string, any>): string {
    const { conditions } = rule;
    let message = `${rule.name}: ${conditions.metric} is ${value} (threshold: ${conditions.operator} ${conditions.threshold})`;
    
    if (metadata) {
      const relevantMetadata = Object.entries(metadata)
        .filter(([key]) => !['timestamp', 'ruleId'].includes(key))
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
      
      if (relevantMetadata) {
        message += `. Additional info: ${relevantMetadata}`;
      }
    }
    
    return message;
  }

  // Send notifications for an alert
  private async sendNotifications(rule: AlertRule, alert: Alert) {
    const notifications = rule.notifications;

    // Send email notifications
    if (notifications.email?.enabled && notifications.email.recipients.length > 0) {
      try {
        await this.sendEmailNotification(alert, notifications.email.recipients);
        alert.notificationsSent.push('email');
      } catch (error) {
        logger.error('Error sending email notification', error);
      }
    }

    // Send webhook notifications
    if (notifications.webhook?.enabled && notifications.webhook.url) {
      try {
        await this.sendWebhookNotification(alert, notifications.webhook);
        alert.notificationsSent.push('webhook');
      } catch (error) {
        logger.error('Error sending webhook notification', error);
      }
    }

    // Send SMS notifications
    if (notifications.sms?.enabled && notifications.sms.recipients.length > 0) {
      try {
        await this.sendSMSNotification(alert, notifications.sms.recipients);
        alert.notificationsSent.push('sms');
      } catch (error) {
        logger.error('Error sending SMS notification', error);
      }
    }
  }

  // Send email notification
  private async sendEmailNotification(alert: Alert, recipients: string[]) {
    // This is a placeholder - integrate with your email service (SendGrid, AWS SES, etc.)
    logger.info('Email notification sent', {
      alertId: alert.id,
      recipients,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      message: alert.message
    });
  }

  // Send webhook notification
  private async sendWebhookNotification(alert: Alert, webhook: { url: string; headers?: Record<string, string> }) {
    try {
      const response = await safeFetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers
        },
        body: JSON.stringify({
          alert,
          timestamp: new Date().toISOString(),
          source: 'broskis-kitchen-monitoring'
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      logger.info('Webhook notification sent', {
        alertId: alert.id,
        webhookUrl: webhook.url,
        status: response.status
      });
    } catch (error) {
      logger.error('Error sending webhook notification', error);
      throw error;
    }
  }

  // Send SMS notification
  private async sendSMSNotification(alert: Alert, recipients: string[]) {
    // This is a placeholder - integrate with your SMS service (Twilio, AWS SNS, etc.)
    logger.info('SMS notification sent', {
      alertId: alert.id,
      recipients,
      message: `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`
    });
  }

  // Resolve an alert
  async resolveAlert(alertId: string, resolvedBy?: string) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    
    if (resolvedBy) {
      alert.metadata = { ...alert.metadata, resolvedBy };
    }

    // Update in database via API
    try {
      const response = await safeFetch('/api/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alertId,
          updates: {
            resolved: true,
            resolvedAt: alert.resolvedAt,
            metadata: alert.metadata
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update alert');
      }
    } catch (error) {
      logger.error('Error updating resolved alert in database', error);
    }

    this.activeAlerts.delete(alertId);

    logger.info('Alert resolved', {
      alertId,
      resolvedBy,
      duration: new Date(alert.resolvedAt).getTime() - new Date(alert.timestamp).getTime()
    });
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  // Get alert rules
  getAlertRules(): AlertRule[] {
    return this.alertRules;
  }

  // Update alert rule
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>) {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    }
  }
}

// Create singleton instance
export const alertService = new AlertService();

// Export types
export type { Alert, AlertRule };