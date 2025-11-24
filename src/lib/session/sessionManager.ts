import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { DecodedIdToken } from "firebase-admin/auth";
import { getToken } from "next-auth/jwt";

export interface SessionConfig {
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none";
  domain?: string;
  path: string;
}

export interface SessionData {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: string;
  displayName?: string;
  photoURL?: string;
  customClaims?: Record<string, any>;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  refreshToken?: string;
}

export interface SessionValidationResult {
  valid: boolean;
  session?: SessionData;
  error?: string;
  errorCode?: SessionErrorCode;
  needsRefresh?: boolean;
}

export type SessionErrorCode = 
  | "NO_SESSION"
  | "INVALID_SESSION"
  | "EXPIRED_SESSION"
  | "REVOKED_SESSION"
  | "MALFORMED_SESSION"
  | "VERIFICATION_FAILED"
  | "REFRESH_REQUIRED";

export const SESSION_CONFIG: SessionConfig = {
  maxAge: 60 * 60 * 8, // 8 hours
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  domain: process.env.COOKIE_DOMAIN
};

export const SESSION_TIMEOUTS = {
  SESSION_MAX_AGE: 60 * 60 * 8, // 8 hours
  REFRESH_THRESHOLD: 60 * 30, // 30 minutes before expiry
  INACTIVITY_TIMEOUT: 60 * 60, // 1 hour of inactivity
  ABSOLUTE_TIMEOUT: 60 * 60 * 12, // 12 hours absolute max
};

/**
 * Enhanced session manager with comprehensive security and error handling
 */
export class SessionManager {
  private static instance: SessionManager;
  private sessionCache = new Map<string, SessionData>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Create a new session with enhanced security
   */
  async createSession(
    userId: string,
    idToken: string,
    additionalData?: Partial<SessionData>
  ): Promise<SessionData> {
    try {
      // Verify the ID token first
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      
      if (!decodedToken.uid || decodedToken.uid !== userId) {
        throw new Error("Token UID mismatch");
      }

      const sessionId = this.generateSessionId();
      const now = Date.now();
      const expiresAt = now + (SESSION_TIMEOUTS.SESSION_MAX_AGE * 1000);

      const sessionData: SessionData = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        emailVerified: decodedToken.email_verified || false,
        role: (decodedToken as any).admin === true ? "admin" : ((decodedToken as any).role || "customer"),
        displayName: decodedToken.name || additionalData?.displayName,
        photoURL: decodedToken.picture || additionalData?.photoURL,
        customClaims: decodedToken,
        sessionId,
        createdAt: now,
        expiresAt,
        lastActivity: now,
        refreshToken: additionalData?.refreshToken,
      };

      await this.setSessionCookie(idToken);
      
      // Cache the session
      this.sessionCache.set(sessionId, sessionData);
      
      console.log(`[SESSION] Created session ${sessionId} for user ${userId}`);
      return sessionData;
    } catch (error) {
      console.error("[SESSION] Failed to create session:", error);
      throw new Error("Session creation failed");
    }
  }

  /**
   * Validate and retrieve session data
   */
  async validateSession(request?: NextRequest): Promise<SessionValidationResult> {
    try {
      let sessionCookie: string | undefined;
      
      if (request) {
        sessionCookie = request.cookies.get("__session")?.value;
      } else {
        const cookieStore = await cookies();
        sessionCookie = cookieStore.get("__session")?.value;
      }

      if (!sessionCookie) {
        return {
          valid: false,
          error: "No session cookie found",
          errorCode: "NO_SESSION"
        };
      }

      // Check cache first
      const cachedSession = this.getCachedSession(sessionCookie);
      if (cachedSession) {
        return {
          valid: true,
          session: cachedSession,
          needsRefresh: this.needsRefresh(cachedSession)
        };
      }

      // Verify session cookie with Firebase Admin
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      
      if (!decodedToken.uid) {
        return {
          valid: false,
          error: "Invalid session token structure",
          errorCode: "MALFORMED_SESSION"
        };
      }

      // Check session expiration
      const now = Date.now();
      const sessionExpiry = decodedToken.exp * 1000;
      
      if (sessionExpiry <= now) {
        return {
          valid: false,
          error: "Session has expired",
          errorCode: "EXPIRED_SESSION"
        };
      }

      // Check absolute timeout
      const sessionAge = now - (decodedToken.auth_time * 1000);
      if (sessionAge > (SESSION_TIMEOUTS.ABSOLUTE_TIMEOUT * 1000)) {
        return {
          valid: false,
          error: "Session exceeded maximum lifetime",
          errorCode: "EXPIRED_SESSION"
        };
      }

      // Create session data
      const sessionData: SessionData = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        emailVerified: decodedToken.email_verified || false,
        role: (decodedToken as any).admin === true ? "admin" : ((decodedToken as any).role || "customer"),
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        customClaims: decodedToken,
        sessionId: sessionCookie.substring(0, 16), // Use part of cookie as session ID
        createdAt: decodedToken.auth_time * 1000,
        expiresAt: sessionExpiry,
        lastActivity: now,
      };

      // Check inactivity timeout
      if (this.isInactive(sessionData)) {
        return {
          valid: false,
          error: "Session expired due to inactivity",
          errorCode: "EXPIRED_SESSION"
        };
      }

      // Cache the session
      this.sessionCache.set(sessionData.sessionId, sessionData);
      
      return {
        valid: true,
        session: sessionData,
        needsRefresh: this.needsRefresh(sessionData)
      };
    } catch (error: any) {
      console.error("[SESSION] Validation failed:", error);
      
      let errorCode: SessionErrorCode = "VERIFICATION_FAILED";
      let errorMessage = "Session validation failed";
      
      if (error.code === 'auth/session-cookie-expired') {
        errorCode = "EXPIRED_SESSION";
        errorMessage = "Session has expired";
      } else if (error.code === 'auth/session-cookie-revoked') {
        errorCode = "REVOKED_SESSION";
        errorMessage = "Session has been revoked";
      } else if (error.code === 'auth/invalid-session-cookie') {
        errorCode = "INVALID_SESSION";
        errorMessage = "Invalid session cookie";
      }
      
      return {
        valid: false,
        error: errorMessage,
        errorCode
      };
    }
  }

  /**
   * Refresh session if needed
   */
  async refreshSession(sessionData: SessionData): Promise<SessionData> {
    try {
      const now = Date.now();
      const newExpiry = now + (SESSION_TIMEOUTS.SESSION_MAX_AGE * 1000);
      
      const refreshedSession: SessionData = {
        ...sessionData,
        expiresAt: newExpiry,
        lastActivity: now,
      };

      await this.setSessionCookie(refreshedSession);
      this.sessionCache.set(sessionData.sessionId, refreshedSession);
      
      console.log(`[SESSION] Refreshed session ${sessionData.sessionId}`);
      return refreshedSession;
    } catch (error) {
      console.error("[SESSION] Failed to refresh session:", error);
      throw new Error("Session refresh failed");
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId?: string): Promise<void> {
    try {
      const cookieStore = await cookies();
      cookieStore.set("__session", "", {
        ...SESSION_CONFIG,
        maxAge: 0,
      });

      if (sessionId) {
        this.sessionCache.delete(sessionId);
      }

      console.log(`[SESSION] Invalidated session ${sessionId || "current"}`);
    } catch (error) {
      console.error("[SESSION] Failed to invalidate session:", error);
      throw new Error("Session invalidation failed");
    }
  }

  /**
   * Update session activity
   */
  async updateActivity(sessionId: string): Promise<void> {
    const session = this.sessionCache.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      this.sessionCache.set(sessionId, session);
    }
  }

  /**
   * Set session cookie with proper security
   */
  private async setSessionCookie(idToken: string): Promise<void> {
    const cookieStore = await cookies();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_TIMEOUTS.SESSION_MAX_AGE * 1000 });
    cookieStore.set("__session", sessionCookie, { ...SESSION_CONFIG, maxAge: SESSION_TIMEOUTS.SESSION_MAX_AGE });
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if session needs refresh
   */
  private needsRefresh(session: SessionData): boolean {
    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    return timeUntilExpiry <= (SESSION_TIMEOUTS.REFRESH_THRESHOLD * 1000);
  }

  /**
   * Check if session is inactive
   */
  private isInactive(session: SessionData): boolean {
    const now = Date.now();
    const timeSinceLastActivity = now - session.lastActivity;
    return timeSinceLastActivity > (SESSION_TIMEOUTS.INACTIVITY_TIMEOUT * 1000);
  }

  /**
   * Get cached session
   */
  private getCachedSession(sessionCookie: string): SessionData | null {
    const sessionId = sessionCookie.substring(0, 16);
    const cached = this.sessionCache.get(sessionId);
    
    if (cached && (Date.now() - cached.lastActivity) < this.CACHE_TTL) {
      return cached;
    }
    
    return null;
  }

  /**
   * Clean up expired sessions from cache
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessionCache.entries()) {
      if (session.expiresAt <= now || this.isInactive(session)) {
        this.sessionCache.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
