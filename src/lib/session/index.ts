// Session Management System - Main Export File
export {
  sessionManager,
  SessionManager,
  SESSION_CONFIG,
  SESSION_TIMEOUTS,
  type SessionConfig,
  type SessionData,
  type SessionValidationResult,
  type SessionErrorCode
} from "./sessionManager";

export {
  SessionValidator,
  createSessionMiddleware,
  sessionMiddleware,
  type ValidationOptions,
  type ValidationContext
} from "./sessionValidation";

export {
  sessionTimeoutManager,
  timeoutMiddleware,
  SessionTimeoutManager,
  ClientTimeoutHandler,
  type TimeoutConfig,
  type TimeoutState,
  type TimeoutEvent
} from "./sessionTimeout";

export {
  sessionErrorHandler,
  errorMiddleware,
  SessionErrorHandler,
  type ErrorContext,
  type ErrorResponse,
  type RecoveryStrategy
} from "./sessionErrorHandler";

export {
  browserSessionManager,
  browserCompatibilityMiddleware,
  BrowserSessionManager,
  type BrowserInfo,
  type SessionStorageConfig,
  type CrossBrowserSession
} from "./sessionBrowser";

export {
  sessionMonitoring,
  monitoringMiddleware,
  SessionMonitoring,
  type SessionMetrics,
  type SessionHealth,
  type SessionEvent
} from "./sessionMonitoring";

// Combined middleware for easy integration
export { createCombinedSessionMiddleware } from "./middleware";

// Utility functions
export {
  validateSessionRequest,
  refreshSessionIfNeeded,
  clearAllSessionData,
  getSessionInfo,
  isSessionValid
} from "./utils";