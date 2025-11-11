import { sessionManager, SessionData } from "./sessionManager";
import { NextRequest, NextResponse } from "next/server";

export interface TimeoutConfig {
  inactivityTimeout: number; // seconds
  absoluteTimeout: number; // seconds
  refreshThreshold: number; // seconds
  warningThreshold: number; // seconds
}

export interface TimeoutState {
  isActive: boolean;
  timeRemaining: number;
  timeUntilWarning: number;
  lastActivity: number;
  createdAt: number;
  expiresAt: number;
}

export interface TimeoutEvent {
  type: "warning" | "expiry" | "refresh";
  timestamp: number;
  sessionId: string;
  userId: string;
  timeRemaining?: number;
}

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  inactivityTimeout: 60 * 60, // 1 hour
  absoluteTimeout: 60 * 60 * 12, // 12 hours
  refreshThreshold: 30 * 60, // 30 minutes
  warningThreshold: 5 * 60, // 5 minutes
};

/**
 * Session timeout manager with comprehensive timeout handling
 */
export class SessionTimeoutManager {
  private static instance: SessionTimeoutManager;
  private timeoutIntervals = new Map<string, NodeJS.Timeout>();
  private eventListeners = new Map<string, Set<(event: TimeoutEvent) => void>>();
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  static getInstance(): SessionTimeoutManager {
    if (!SessionTimeoutManager.instance) {
      SessionTimeoutManager.instance = new SessionTimeoutManager();
    }
    return SessionTimeoutManager.instance;
  }

  /**
   * Start timeout monitoring for a session
   */
  startTimeoutMonitoring(sessionId: string, session: SessionData): void {
    this.stopTimeoutMonitoring(sessionId); // Stop existing monitoring

    const interval = setInterval(() => {
      this.checkTimeouts(sessionId, session);
    }, this.CHECK_INTERVAL);

    this.timeoutIntervals.set(sessionId, interval);
    console.log(`[TIMEOUT] Started monitoring for session ${sessionId}`);
  }

  /**
   * Stop timeout monitoring for a session
   */
  stopTimeoutMonitoring(sessionId: string): void {
    const interval = this.timeoutIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.timeoutIntervals.delete(sessionId);
      console.log(`[TIMEOUT] Stopped monitoring for session ${sessionId}`);
    }
  }

  /**
   * Check timeouts for a session
   */
  private checkTimeouts(sessionId: string, session: SessionData): void {
    const now = Date.now();
    const timeoutState = this.getTimeoutState(session);

    if (!timeoutState.isActive) {
      this.stopTimeoutMonitoring(sessionId);
      return;
    }

    // Check for warning threshold
    if (timeoutState.timeUntilWarning <= 0 && timeoutState.timeRemaining > 0) {
      this.emitEvent(sessionId, {
        type: "warning",
        timestamp: now,
        sessionId,
        userId: session.uid,
        timeRemaining: timeoutState.timeRemaining
      });
    }

    // Check for expiry
    if (timeoutState.timeRemaining <= 0) {
      this.emitEvent(sessionId, {
        type: "expiry",
        timestamp: now,
        sessionId,
        userId: session.uid
      });
      this.stopTimeoutMonitoring(sessionId);
      return;
    }

    // Check for refresh threshold
    if (timeoutState.timeRemaining <= (DEFAULT_TIMEOUT_CONFIG.refreshThreshold * 1000)) {
      this.emitEvent(sessionId, {
        type: "refresh",
        timestamp: now,
        sessionId,
        userId: session.uid,
        timeRemaining: timeoutState.timeRemaining
      });
    }
  }

  /**
   * Get current timeout state for a session
   */
  getTimeoutState(session: SessionData): TimeoutState {
    const now = Date.now();
    const timeSinceLastActivity = now - session.lastActivity;
    const timeSinceCreation = now - session.createdAt;
    const timeUntilExpiry = session.expiresAt - now;

    // Check inactivity timeout
    const inactivityRemaining = Math.max(0, 
      (DEFAULT_TIMEOUT_CONFIG.inactivityTimeout * 1000) - timeSinceLastActivity
    );

    // Check absolute timeout
    const absoluteRemaining = Math.max(0,
      (DEFAULT_TIMEOUT_CONFIG.absoluteTimeout * 1000) - timeSinceCreation
    );

    // Use the shorter timeout
    const timeRemaining = Math.min(timeUntilExpiry, inactivityRemaining, absoluteRemaining);
    const isActive = timeRemaining > 0;
    const timeUntilWarning = Math.max(0, timeRemaining - (DEFAULT_TIMEOUT_CONFIG.warningThreshold * 1000));

    return {
      isActive,
      timeRemaining,
      timeUntilWarning,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId: string, session: SessionData): void {
    session.lastActivity = Date.now();
    console.log(`[TIMEOUT] Updated activity for session ${sessionId}`);
  }

  /**
   * Handle session refresh
   */
  async handleRefresh(sessionId: string, session: SessionData): Promise<void> {
    try {
      await sessionManager.refreshSession(session);
      console.log(`[TIMEOUT] Refreshed session ${sessionId}`);
    } catch (error) {
      console.error(`[TIMEOUT] Failed to refresh session ${sessionId}:`, error);
    }
  }

  /**
   * Handle session expiry
   */
  async handleExpiry(sessionId: string, session: SessionData): Promise<void> {
    try {
      await sessionManager.invalidateSession(sessionId);
      console.log(`[TIMEOUT] Expired session ${sessionId}`);
    } catch (error) {
      console.error(`[TIMEOUT] Failed to expire session ${sessionId}:`, error);
    }
  }

  /**
   * Add event listener
   */
  addEventListener(sessionId: string, listener: (event: TimeoutEvent) => void): void {
    if (!this.eventListeners.has(sessionId)) {
      this.eventListeners.set(sessionId, new Set());
    }
    this.eventListeners.get(sessionId)!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(sessionId: string, listener: (event: TimeoutEvent) => void): void {
    const listeners = this.eventListeners.get(sessionId);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(sessionId);
      }
    }
  }

  /**
   * Emit timeout event
   */
  private emitEvent(sessionId: string, event: TimeoutEvent): void {
    const listeners = this.eventListeners.get(sessionId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[TIMEOUT] Event listener error for session ${sessionId}:`, error);
        }
      });
    }

    // Log the event
    console.log(`[TIMEOUT_EVENT] ${event.type} for session ${sessionId}:`, JSON.stringify(event));
  }

  /**
   * Clean up all monitoring
   */
  cleanup(): void {
    this.timeoutIntervals.forEach((interval, sessionId) => {
      clearInterval(interval);
      console.log(`[TIMEOUT] Cleaned up monitoring for session ${sessionId}`);
    });
    this.timeoutIntervals.clear();
    this.eventListeners.clear();
  }
}

/**
 * Session timeout middleware
 */
export function createTimeoutMiddleware() {
  const timeoutManager = SessionTimeoutManager.getInstance();

  return async (request: NextRequest) => {
    try {
      const sessionCookie = request.cookies.get("__session")?.value;
      if (!sessionCookie) {
        return NextResponse.next();
      }

      // Validate session first
      const validationResult = await sessionManager.validateSession(request);
      if (!validationResult.valid || !validationResult.session) {
        return NextResponse.next();
      }

      const session = validationResult.session;
      const timeoutState = timeoutManager.getTimeoutState(session);

      // Check if session is expired
      if (!timeoutState.isActive) {
        await timeoutManager.handleExpiry(session.sessionId, session);
        return NextResponse.json(
          { error: "Session expired", errorCode: "SESSION_EXPIRED" },
          { status: 401 }
        );
      }

      // Update activity for this request
      timeoutManager.updateActivity(session.sessionId, session);

      // Add timeout headers to response
      const response = NextResponse.next();
      response.headers.set("x-session-time-remaining", timeoutState.timeRemaining.toString());
      response.headers.set("x-session-time-until-warning", timeoutState.timeUntilWarning.toString());
      response.headers.set("x-session-active", timeoutState.isActive.toString());

      return response;
    } catch (error) {
      console.error("[TIMEOUT] Middleware error:", error);
      return NextResponse.next();
    }
  };
}

/**
 * Client-side timeout handler
 */
export class ClientTimeoutHandler {
  private timeoutManager = SessionTimeoutManager.getInstance();
  private eventSource?: EventSource;
  private warningShown = false;

  /**
   * Initialize client-side timeout handling
   */
  initialize(sessionId: string): void {
    this.setupEventListeners(sessionId);
    this.startHeartbeat(sessionId);
  }

  /**
   * Setup event listeners for timeout events
   */
  private setupEventListeners(sessionId: string): void {
    this.timeoutManager.addEventListener(sessionId, (event) => {
      switch (event.type) {
        case "warning":
          this.handleWarning(event);
          break;
        case "expiry":
          this.handleExpiry(event);
          break;
        case "refresh":
          this.handleRefresh(event);
          break;
      }
    });
  }

  /**
   * Handle timeout warning
   */
  private handleWarning(event: TimeoutEvent): void {
    if (!this.warningShown) {
      this.warningShown = true;
      const minutesRemaining = Math.ceil((event.timeRemaining || 0) / 60000);
      
      if (typeof window !== 'undefined') {
        // Show warning notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Session Expiring Soon', {
            body: `Your session will expire in ${minutesRemaining} minutes. Click to extend.`,
            icon: '/favicon.ico'
          });
        }

        // Dispatch custom event for UI components
        window.dispatchEvent(new CustomEvent('sessionWarning', {
          detail: {
            timeRemaining: event.timeRemaining,
            minutesRemaining
          }
        }));
      }
    }
  }

  /**
   * Handle session expiry
   */
  private handleExpiry(event: TimeoutEvent): void {
    if (typeof window !== 'undefined') {
      // Dispatch expiry event
      window.dispatchEvent(new CustomEvent('sessionExpired', {
        detail: { sessionId: event.sessionId }
      }));

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login?session=expired';
      }, 5000);
    }
  }

  /**
   * Handle session refresh
   */
  private handleRefresh(event: TimeoutEvent): void {
    if (typeof window !== 'undefined') {
      // Attempt to refresh session via API
      fetch('/api/auth/session/refresh', {
        method: 'POST',
        credentials: 'include'
      }).then(response => {
        if (response.ok) {
          this.warningShown = false; // Reset warning flag
        }
      }).catch(error => {
        console.error('Failed to refresh session:', error);
      });
    }
  }

  /**
   * Start heartbeat to keep session alive
   */
  private startHeartbeat(sessionId: string): void {
    if (typeof window !== 'undefined') {
      // Send heartbeat every 5 minutes
      setInterval(() => {
        fetch('/api/auth/session/heartbeat', {
          method: 'POST',
          credentials: 'include'
        }).catch(error => {
          console.error('Heartbeat failed:', error);
        });
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Cleanup
   */
  cleanup(sessionId: string): void {
    this.timeoutManager.removeEventListener(sessionId, () => {});
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

// Export singleton instances
export const sessionTimeoutManager = SessionTimeoutManager.getInstance();
export const timeoutMiddleware = createTimeoutMiddleware();