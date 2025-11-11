import { useCallback, useEffect, useState } from 'react';
import { useAppSession } from '@/components/providers/SessionProvider';
import { getSessionInfo, validateSessionRequest, isSessionExpiringSoon } from '@/lib/session/utils';
import { toast } from 'sonner';

export interface UseSessionManagementOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showWarnings?: boolean;
  onSessionExpired?: () => void;
  onSessionWarning?: (timeRemaining: number) => void;
}

export function useSessionManagement(options: UseSessionManagementOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    showWarnings = true,
    onSessionExpired,
    onSessionWarning,
  } = options;

  const session = useAppSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Auto-refresh session
  useEffect(() => {
    if (!autoRefresh || !session.isAuthenticated) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true);
        setRefreshError(null);
        
        await session.refreshSession();
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        setRefreshError(error instanceof Error ? error.message : 'Refresh failed');
      } finally {
        setIsRefreshing(false);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, session.isAuthenticated, session.refreshSession]);

  // Session expiration warning
  useEffect(() => {
    if (!showWarnings || !session.isAuthenticated) {
      return;
    }

    const checkExpiration = async () => {
      try {
        const sessionInfo = await getSessionInfo();
        
        if (sessionInfo.isExpiringSoon) {
          const timeRemaining = sessionInfo.timeUntilExpiry || 0;
          
          if (onSessionWarning) {
            onSessionWarning(timeRemaining);
          } else {
            toast.warning(`Session expiring soon (${Math.ceil(timeRemaining / 60000)} minutes)`, {
              duration: 5000,
              action: {
                label: 'Extend',
                onClick: () => session.extendSession(),
              },
            });
          }
        }
        
        if (sessionInfo.isExpired) {
          if (onSessionExpired) {
            onSessionExpired();
          } else {
            toast.error('Session expired. Please log in again.');
            session.logout();
          }
        }
      } catch (error) {
        console.error('Session expiration check failed:', error);
      }
    };

    // Check immediately and then every minute
    checkExpiration();
    const interval = setInterval(checkExpiration, 60000);

    return () => clearInterval(interval);
  }, [showWarnings, session.isAuthenticated, onSessionWarning, onSessionExpired, session]);

  // Manual session validation
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      setRefreshError(null);
      const result = await validateSessionRequest();
      return result.isValid;
    } catch (error) {
      console.error('Session validation failed:', error);
      setRefreshError(error instanceof Error ? error.message : 'Validation failed');
      return false;
    }
  }, []);

  // Check if session needs refresh
  const needsRefresh = useCallback(async (): Promise<boolean> => {
    try {
      return await isSessionExpiringSoon();
    } catch (error) {
      console.error('Session refresh check failed:', error);
      return false;
    }
  }, []);

  // Manual refresh with error handling
  const manualRefresh = useCallback(async (): Promise<boolean> => {
    try {
      setIsRefreshing(true);
      setRefreshError(null);
      
      await session.refreshSession();
      setLastRefresh(new Date());
      return true;
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setRefreshError(error instanceof Error ? error.message : 'Refresh failed');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [session.refreshSession]);

  // Get session health status
  const getSessionHealth = useCallback(async () => {
    try {
      const isHealthy = await session.checkSessionHealth();
      return {
        isHealthy,
        isAuthenticated: session.isAuthenticated,
        hasError: !!session.error,
        isExpiring: session.sessionExpiry ? 
          session.sessionExpiry.getTime() - Date.now() < 10 * 60 * 1000 : false,
      };
    } catch (error) {
      console.error('Session health check failed:', error);
      return {
        isHealthy: false,
        isAuthenticated: session.isAuthenticated,
        hasError: true,
        isExpiring: false,
      };
    }
  }, [session]);

  return {
    // Session state
    ...session,
    
    // Refresh state
    isRefreshing,
    lastRefresh,
    refreshError,
    
    // Methods
    validateSession,
    needsRefresh,
    manualRefresh,
    getSessionHealth,
  };
}

// Hook for protected routes
export function useProtectedSession(options: UseSessionManagementOptions = {}) {
  const session = useSessionManagement({
    autoRefresh: true,
    showWarnings: true,
    ...options,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!session.isLoading && !session.isAuthenticated) {
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
  }, [session.isLoading, session.isAuthenticated]);

  return session;
}

// Hook for admin routes
export function useAdminSession(options: UseSessionManagementOptions = {}) {
  const session = useProtectedSession(options);

  // Check admin role
  useEffect(() => {
    if (!session.isLoading && session.isAuthenticated && session.user?.role !== 'admin') {
      window.location.href = '/403';
    }
  }, [session.isLoading, session.isAuthenticated, session.user?.role]);

  return session;
}

// Hook for session-aware API calls
export function useSessionAwareAPI() {
  const session = useAppSession();

  const makeAuthenticatedRequest = useCallback(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    // Check session before making request
    if (!session.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Validate session before request
    const isValid = await validateSessionRequest();
    if (!isValid.isValid) {
      throw new Error('Session invalid');
    }

    // Add authentication headers
    const headers = new Headers(options.headers);
    headers.set('X-Session-Valid', 'true');

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Session expired, redirect to login
        session.logout();
        throw new Error('Session expired');
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }, [session]);

  return {
    makeAuthenticatedRequest,
    isAuthenticated: session.isAuthenticated,
  };
}