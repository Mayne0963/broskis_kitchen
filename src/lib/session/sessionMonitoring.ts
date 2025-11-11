import { sessionManager, SessionData } from "./sessionManager";
import { sessionTimeoutManager, TimeoutEvent } from "./sessionTimeout";
import { sessionErrorHandler } from "./sessionErrorHandler";
import { NextRequest } from "next/server";

export interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  refreshedSessions: number;
  errorRate: number;
  averageSessionDuration: number;
  timeoutEvents: number;
  crossBrowserSessions: number;
}

export interface SessionHealth {
  status: "healthy" | "degraded" | "unhealthy";
  issues: string[];
  recommendations: string[];
  lastChecked: number;
}

export interface SessionEvent {
  type: "created" | "validated" | "refreshed" | "expired" | "error" | "timeout";
  sessionId: string;
  userId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Comprehensive session monitoring system
 */
export class SessionMonitoring {
  private static instance: SessionMonitoring;
  private metrics: SessionMetrics;
  private events: SessionEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private monitoringInterval?: NodeJS.Timeout;
  private readonly MONITORING_INTERVAL_MS = 60000; // 1 minute

  static getInstance(): SessionMonitoring {
    if (!SessionMonitoring.instance) {
      SessionMonitoring.instance = new SessionMonitoring();
      SessionMonitoring.instance.startMonitoring();
    }
    return SessionMonitoring.instance;
  }

  private constructor() {
    this.metrics = {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0,
      refreshedSessions: 0,
      errorRate: 0,
      averageSessionDuration: 0,
      timeoutEvents: 0,
      crossBrowserSessions: 0
    };
  }

  /**
   * Start monitoring system
   */
  private startMonitoring(): void {
    // Monitor session events
    this.setupEventListeners();
    
    // Start periodic health checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.MONITORING_INTERVAL_MS);

    console.log("[MONITORING] Session monitoring started");
  }

  /**
   * Setup event listeners for session events
   */
  private setupEventListeners(): void {
    // Listen for timeout events
    sessionTimeoutManager.addEventListener("*", (event: TimeoutEvent) => {
      this.recordEvent({
        type: "timeout",
        sessionId: event.sessionId,
        userId: event.userId,
        timestamp: event.timestamp,
        metadata: {
          timeoutType: event.type,
          timeRemaining: event.timeRemaining
        }
      });

      this.metrics.timeoutEvents++;
    });
  }

  /**
   * Record session event
   */
  recordEvent(event: SessionEvent): void {
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Update metrics based on event type
    this.updateMetrics(event);
    
    console.log(`[MONITORING] Event recorded: ${event.type} for session ${event.sessionId}`);
  }

  /**
   * Update metrics based on event
   */
  private updateMetrics(event: SessionEvent): void {
    switch (event.type) {
      case "created":
        this.metrics.totalSessions++;
        this.metrics.activeSessions++;
        break;
      case "expired":
        this.metrics.activeSessions = Math.max(0, this.metrics.activeSessions - 1);
        this.metrics.expiredSessions++;
        break;
      case "refreshed":
        this.metrics.refreshedSessions++;
        break;
      case "error":
        this.calculateErrorRate();
        break;
    }
  }

  /**
   * Calculate current error rate
   */
  private calculateErrorRate(): void {
    const recentEvents = this.getRecentEvents(3600000); // Last hour
    const errorEvents = recentEvents.filter(e => e.type === "error");
    const totalEvents = recentEvents.length;
    
    this.metrics.errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0;
  }

  /**
   * Get recent events within time window
   */
  private getRecentEvents(timeWindowMs: number): SessionEvent[] {
    const cutoffTime = Date.now() - timeWindowMs;
    return this.events.filter(e => e.timestamp >= cutoffTime);
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const health = this.getSessionHealth();
    
    if (health.status !== "healthy") {
      console.warn("[MONITORING] Session health issues detected:", health.issues);
      
      // Log detailed health report
      this.logHealthReport(health);
    }
  }

  /**
   * Get current session health
   */
  getSessionHealth(): SessionHealth {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check error rate
    if (this.metrics.errorRate > 5) {
      issues.push(`High error rate: ${this.metrics.errorRate.toFixed(2)}%`);
      recommendations.push("Investigate recent authentication failures");
    }

    // Check session distribution
    if (this.metrics.activeSessions > 100) {
      issues.push(`High active session count: ${this.metrics.activeSessions}`);
      recommendations.push("Consider implementing session cleanup");
    }

    // Check timeout events
    const recentTimeoutEvents = this.getRecentEvents(3600000).filter(e => e.type === "timeout");
    if (recentTimeoutEvents.length > 10) {
      issues.push(`High timeout rate: ${recentTimeoutEvents.length} in last hour`);
      recommendations.push("Review session timeout configuration");
    }

    // Check for session inconsistencies
    const validationIssues = this.checkValidationConsistency();
    if (validationIssues.length > 0) {
      issues.push(...validationIssues);
      recommendations.push("Review authentication validation logic");
    }

    // Determine health status
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (issues.length >= 3) {
      status = "unhealthy";
    } else if (issues.length > 0) {
      status = "degraded";
    }

    return {
      status,
      issues,
      recommendations,
      lastChecked: Date.now()
    };
  }

  /**
   * Check validation consistency
   */
  private checkValidationConsistency(): string[] {
    const issues: string[] = [];
    const recentEvents = this.getRecentEvents(3600000);
    
    // Check for validation failures
    const validationFailures = recentEvents.filter(e => 
      e.type === "error" && e.metadata?.errorCode?.includes("VALIDATION")
    );
    
    if (validationFailures.length > 5) {
      issues.push(`Validation failures: ${validationFailures.length} in last hour`);
    }

    return issues;
  }

  /**
   * Log health report
   */
  private logHealthReport(health: SessionHealth): void {
    console.log("[MONITORING] Session Health Report:");
    console.log(`Status: ${health.status}`);
    console.log(`Issues: ${health.issues.length}`);
    console.log(`Recommendations: ${health.recommendations.length}`);
    console.log(`Active Sessions: ${this.metrics.activeSessions}`);
    console.log(`Error Rate: ${this.metrics.errorRate.toFixed(2)}%`);
    console.log(`Timeout Events: ${this.metrics.timeoutEvents}`);
  }

  /**
   * Get current metrics
   */
  getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get session statistics
   */
  getSessionStats(): Record<string, any> {
    const now = Date.now();
    const last24Hours = this.getRecentEvents(86400000);
    const lastHour = this.getRecentEvents(3600000);

    return {
      totalSessions: this.metrics.totalSessions,
      activeSessions: this.metrics.activeSessions,
      sessions24h: last24Hours.filter(e => e.type === "created").length,
      sessions1h: lastHour.filter(e => e.type === "created").length,
      avgSessionDuration: this.calculateAverageSessionDuration(),
      topErrorCodes: this.getTopErrorCodes(),
      browserDistribution: this.getBrowserDistribution(),
      peakUsageHour: this.getPeakUsageHour()
    };
  }

  /**
   * Calculate average session duration
   */
  private calculateAverageSessionDuration(): number {
    const createdEvents = this.events.filter(e => e.type === "created");
    const expiredEvents = this.events.filter(e => e.type === "expired");
    
    if (createdEvents.length === 0 || expiredEvents.length === 0) {
      return 0;
    }

    const totalDuration = expiredEvents.reduce((sum, expired) => {
      const created = createdEvents.find(c => c.sessionId === expired.sessionId);
      if (created) {
        return sum + (expired.timestamp - created.timestamp);
      }
      return sum;
    }, 0);

    return expiredEvents.length > 0 ? totalDuration / expiredEvents.length : 0;
  }

  /**
   * Get top error codes
   */
  private getTopErrorCodes(): Record<string, number> {
    const errorCodes: Record<string, number> = {};
    const errorEvents = this.events.filter(e => e.type === "error");
    
    errorEvents.forEach(event => {
      const errorCode = event.metadata?.errorCode || "UNKNOWN";
      errorCodes[errorCode] = (errorCodes[errorCode] || 0) + 1;
    });

    return errorCodes;
  }

  /**
   * Get browser distribution
   */
  private getBrowserDistribution(): Record<string, number> {
    const browsers: Record<string, number> = {};
    
    this.events.forEach(event => {
      const browser = event.metadata?.browser || "Unknown";
      browsers[browser] = (browsers[browser] || 0) + 1;
    });

    return browsers;
  }

  /**
   * Get peak usage hour
   */
  private getPeakUsageHour(): number {
    const hours: Record<number, number> = {};
    
    this.events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    return Object.keys(hours).reduce((a, b) => hours[parseInt(a)] > hours[parseInt(b)] ? a : b, "0");
  }

  /**
   * Get recent events
   */
  getEvents(limit: number = 100): SessionEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Monitor specific session
   */
  async monitorSession(sessionId: string, request?: NextRequest): Promise<void> {
    try {
      const validation = await sessionManager.validateSession(request);
      
      if (validation.valid && validation.session) {
        this.recordEvent({
          type: "validated",
          sessionId,
          userId: validation.session.uid,
          timestamp: Date.now(),
          metadata: {
            role: validation.session.role,
            emailVerified: validation.session.emailVerified
          }
        });
      }
    } catch (error) {
      console.error("[MONITORING] Session monitoring failed:", error);
    }
  }

  /**
   * Cleanup monitoring
   */
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    console.log("[MONITORING] Session monitoring stopped");
  }
}

/**
 * Session monitoring middleware
 */
export function createMonitoringMiddleware() {
  const monitoring = SessionMonitoring.getInstance();

  return async (request: NextRequest) => {
    try {
      const sessionCookie = request.cookies.get("__session")?.value;
      if (sessionCookie) {
        const sessionId = sessionCookie.substring(0, 16);
        await monitoring.monitorSession(sessionId, request);
      }

      // Add monitoring headers
      const response = NextResponse.next();
      response.headers.set("x-session-monitoring", "enabled");
      response.headers.set("x-session-metrics", JSON.stringify(monitoring.getMetrics()));
      
      return response;
    } catch (error) {
      console.error("[MONITORING] Middleware error:", error);
      return NextResponse.next();
    }
  };
}

// Export singleton instance and middleware
export const sessionMonitoring = SessionMonitoring.getInstance();
export const monitoringMiddleware = createMonitoringMiddleware();