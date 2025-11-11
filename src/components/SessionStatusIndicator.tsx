'use client';

import React, { useEffect, useState } from 'react';
import { useAppSession } from '@/components/providers/SessionProvider';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { AlertCircle, CheckCircle, Clock, RefreshCw, LogOut, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionStatusIndicatorProps {
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoHide?: boolean;
  hideDelay?: number;
}

export function SessionStatusIndicator({
  showDetails = false,
  position = 'top-right',
  autoHide = true,
  hideDelay = 3000,
}: SessionStatusIndicatorProps) {
  const session = useAppSession();
  const { isRefreshing, refreshError, manualRefresh } = useSessionManagement();
  const [isVisible, setIsVisible] = useState(true);
  const [showRefreshButton, setShowRefreshButton] = useState(false);

  // Auto-hide logic
  useEffect(() => {
    if (!autoHide || !session.isAuthenticated) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);

    return () => clearTimeout(timer);
  }, [autoHide, session.isAuthenticated, hideDelay]);

  // Show refresh button when session is expiring soon
  useEffect(() => {
    if (session.sessionExpiry) {
      const timeUntilExpiry = session.sessionExpiry.getTime() - Date.now();
      const isExpiringSoon = timeUntilExpiry < 10 * 60 * 1000; // 10 minutes
      setShowRefreshButton(isExpiringSoon && session.isAuthenticated);
    }
  }, [session.sessionExpiry, session.isAuthenticated]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await manualRefresh();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  if (!isVisible || !session.isAuthenticated) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getStatusColor = () => {
    if (refreshError) return 'border-red-400 bg-red-50 text-red-700';
    if (isRefreshing) return 'border-blue-400 bg-blue-50 text-blue-700';
    if (showRefreshButton) return 'border-yellow-400 bg-yellow-50 text-yellow-700';
    return 'border-green-400 bg-green-50 text-green-700';
  };

  const getStatusIcon = () => {
    if (refreshError) return <AlertCircle className="h-4 w-4" />;
    if (isRefreshing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (showRefreshButton) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeUntilExpiry = () => {
    if (!session.sessionExpiry) return null;
    const minutes = Math.ceil((session.sessionExpiry.getTime() - Date.now()) / 60000);
    return minutes;
  };

  return (
    <div className={cn(
      'fixed z-50 rounded-lg border shadow-lg p-3 min-w-[200px]',
      'transition-all duration-300 hover:shadow-xl',
      positionClasses[position],
      getStatusColor()
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : refreshError ? 'Error' : showRefreshButton ? 'Expiring Soon' : 'Active'}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {showRefreshButton && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
              title="Refresh Session"
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            </button>
          )}
          
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
            title="Hide"
          >
            ×
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <div className="space-y-1 text-xs">
            {session.user?.email && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span className="truncate">{session.user.email}</span>
              </div>
            )}
            
            {session.user?.role && (
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span className="capitalize">{session.user.role}</span>
              </div>
            )}
            
            {session.sessionExpiry && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  Expires: {formatTime(session.sessionExpiry)}
                  {getTimeUntilExpiry() && ` (${getTimeUntilExpiry()} min)`}
                </span>
              </div>
            )}
            
            {session.lastActivity && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Last Activity: {formatTime(session.lastActivity)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {refreshError && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <div className="text-xs text-red-600">
            Error: {refreshError}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact session status indicator
export function CompactSessionStatus() {
  const session = useAppSession();
  const { isRefreshing, refreshError } = useSessionManagement();
  const [showRefreshButton, setShowRefreshButton] = useState(false);

  useEffect(() => {
    if (session.sessionExpiry) {
      const timeUntilExpiry = session.sessionExpiry.getTime() - Date.now();
      const isExpiringSoon = timeUntilExpiry < 10 * 60 * 1000; // 10 minutes
      setShowRefreshButton(isExpiringSoon && session.isAuthenticated);
    }
  }, [session.sessionExpiry, session.isAuthenticated]);

  if (!session.isAuthenticated) {
    return null;
  }

  const getStatusColor = () => {
    if (refreshError) return 'text-red-500';
    if (isRefreshing) return 'text-blue-500';
    if (showRefreshButton) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (refreshError) return <AlertCircle className="h-4 w-4" />;
    if (isRefreshing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (showRefreshButton) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={getStatusColor()}>
        {getStatusIcon()}
      </div>
      
      {showRefreshButton && (
        <button
          onClick={() => window.location.reload()} // Simple refresh for compact version
          disabled={isRefreshing}
          className="text-xs text-yellow-600 hover:text-yellow-800 underline"
        >
          Refresh
        </button>
      )}
    </div>
  );
}

// Session health check component
export function SessionHealthCheck({ onHealthChange }: { onHealthChange?: (isHealthy: boolean) => void }) {
  const session = useAppSession();
  const { getSessionHealth } = useSessionManagement();
  const [health, setHealth] = useState<{ isHealthy: boolean; isExpiring: boolean }>({ 
    isHealthy: true, 
    isExpiring: false 
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthStatus = await getSessionHealth();
        const newHealth = { 
          isHealthy: healthStatus.isHealthy, 
          isExpiring: healthStatus.isExpiring 
        };
        
        setHealth(newHealth);
        onHealthChange?.(healthStatus.isHealthy);
      } catch (error) {
        console.error('Health check failed:', error);
        const errorHealth = { isHealthy: false, isExpiring: false };
        setHealth(errorHealth);
        onHealthChange?.(false);
      }
    };

    if (session.isAuthenticated) {
      checkHealth();
      const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [session.isAuthenticated, getSessionHealth, onHealthChange]);

  if (!session.isAuthenticated) {
    return null;
  }

  return (
    <div className={cn(
      'inline-flex items-center space-x-2 px-2 py-1 rounded text-xs',
      health.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
      health.isExpiring && 'bg-yellow-100 text-yellow-800'
    )}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        health.isHealthy ? 'bg-green-500' : 'bg-red-500',
        health.isExpiring && 'bg-yellow-500'
      )} />
      <span>{health.isHealthy ? 'Healthy' : 'Unhealthy'}</span>
    </div>
  );
}