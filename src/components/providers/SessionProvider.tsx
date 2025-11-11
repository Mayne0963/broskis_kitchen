'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ClientTimeoutHandler } from '@/lib/session/sessionTimeout';
import { getSessionInfo, refreshSessionIfNeeded, clearAllSessionData } from '@/lib/session/utils';
import { toast } from 'sonner';

export interface SessionState {
  isAuthenticated: boolean;
  user: {
    id?: string;
    email?: string;
    role?: string;
    emailVerified?: boolean;
  } | null;
  isLoading: boolean;
  error: string | null;
  sessionExpiry: Date | null;
  lastActivity: Date | null;
}

interface SessionContextType extends SessionState {
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  checkSessionHealth: () => Promise<boolean>;
  extendSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: nextAuthSession, status } = useSession();
  const [sessionState, setSessionState] = useState<SessionState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
    sessionExpiry: null,
    lastActivity: null,
  });

  const [timeoutHandler] = useState(() => new ClientTimeoutHandler());

  // Update session state based on NextAuth session
  const updateSessionState = useCallback(async () => {
    try {
      if (status === 'loading') {
        setSessionState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      if (!nextAuthSession?.user) {
        setSessionState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
          sessionExpiry: null,
          lastActivity: null,
        });
        return;
      }

      // Get detailed session information
      const sessionInfo = await getSessionInfo();
      
      setSessionState({
        isAuthenticated: true,
        user: {
          id: nextAuthSession.user.id || sessionInfo.userId,
          email: nextAuthSession.user.email,
          role: nextAuthSession.user.role || sessionInfo.role,
          emailVerified: nextAuthSession.user.emailVerified || sessionInfo.emailVerified,
        },
        isLoading: false,
        error: null,
        sessionExpiry: sessionInfo.expiresAt,
        lastActivity: sessionInfo.lastActivity,
      });
    } catch (error) {
      console.error('Failed to update session state:', error);
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [nextAuthSession, status]);

  // Initialize session monitoring
  useEffect(() => {
    updateSessionState();
  }, [updateSessionState]);

  // Setup timeout handler
  useEffect(() => {
    if (!sessionState.isAuthenticated) {
      timeoutHandler.stop();
      return;
    }

    // Configure timeout handler
    timeoutHandler.configure({
      onTimeoutWarning: (timeRemaining) => {
        toast.warning(`Your session will expire in ${Math.ceil(timeRemaining / 60000)} minutes. Click to extend.`, {
          duration: 10000,
          action: {
            label: 'Extend Session',
            onClick: () => extendSession(),
          },
        });
      },
      onTimeout: () => {
        toast.error('Your session has expired. Please log in again.');
        logout();
      },
      onActivity: () => {
        // Update last activity in state
        setSessionState(prev => prev.isAuthenticated ? {
          ...prev,
          lastActivity: new Date(),
        } : prev);
      },
    });

    // Start monitoring
    timeoutHandler.start();

    return () => {
      timeoutHandler.stop();
    };
  }, [sessionState.isAuthenticated, timeoutHandler]);

  // Session refresh function
  const refreshSession = useCallback(async () => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await refreshSessionIfNeeded();
      await updateSessionState();
      
      toast.success('Session refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh session',
      }));
      toast.error('Failed to refresh session');
    }
  }, [updateSessionState]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true }));
      
      // Clear all session data
      await clearAllSessionData();
      
      // Stop timeout handler
      timeoutHandler.stop();
      
      // Redirect to login
      window.location.href = '/auth/login?logout=success';
    } catch (error) {
      console.error('Failed to logout:', error);
      setSessionState(prev => ({ ...prev, isLoading: false }));
    }
  }, [timeoutHandler]);

  // Check session health
  const checkSessionHealth = useCallback(async (): Promise<boolean> => {
    try {
      const sessionInfo = await getSessionInfo();
      return sessionInfo.isValid && !sessionInfo.isExpiringSoon;
    } catch (error) {
      console.error('Session health check failed:', error);
      return false;
    }
  }, []);

  // Extend session function
  const extendSession = useCallback(async () => {
    try {
      await refreshSessionIfNeeded();
      await updateSessionState();
      toast.success('Session extended successfully');
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast.error('Failed to extend session');
    }
  }, [updateSessionState]);

  const contextValue: SessionContextType = {
    ...sessionState,
    refreshSession,
    logout,
    checkSessionHealth,
    extendSession,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook to use session context
export function useAppSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useAppSession must be used within a SessionProvider');
  }
  return context;
}

// Component to display session status
export function SessionStatus() {
  const { isAuthenticated, sessionExpiry, lastActivity, error } = useAppSession();

  if (error) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
        Session Error: {error}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm">
      <div>Session Active</div>
      {sessionExpiry && (
        <div>Expires: {sessionExpiry.toLocaleTimeString()}</div>
      )}
      {lastActivity && (
        <div>Last Activity: {lastActivity.toLocaleTimeString()}</div>
      )}
    </div>
  );
}