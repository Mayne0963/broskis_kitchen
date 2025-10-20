'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { AuthLoadingSpinner } from './AuthLoadingSpinner';
import { AuthErrorBoundary } from './AuthErrorBoundary';

export interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onAuthError?: (error: string) => void;
  onAuthSuccess?: (user: any) => void;
}

interface AuthState {
  isChecking: boolean;
  isAuthorized: boolean;
  error: string | null;
  redirecting: boolean;
}

/**
 * Client-side authentication guard component with comprehensive protection
 */
export function AuthGuard({
  children,
  requireAuth = true,
  requireEmailVerification = false,
  allowedRoles = [],
  fallback,
  redirectTo,
  loadingComponent,
  errorComponent,
  onAuthError,
  onAuthSuccess
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated, claims } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [authState, setAuthState] = useState<AuthState>({
    isChecking: true,
    isAuthorized: false,
    error: null,
    redirecting: false
  });

  const handleAuthError = useCallback((error: string) => {
    setAuthState(prev => ({ ...prev, error, isChecking: false }));
    onAuthError?.(error);
  }, [onAuthError]);

  const handleRedirect = useCallback((url: string, reason: string) => {
    setAuthState(prev => ({ ...prev, redirecting: true }));
    
    const redirectUrl = new URL(url, window.location.origin);
    redirectUrl.searchParams.set('next', pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''));
    redirectUrl.searchParams.set('error', reason);
    
    console.log(`[AUTH_GUARD] Redirecting to ${redirectUrl.toString()} - Reason: ${reason}`);
    router.push(redirectUrl.toString());
  }, [router, pathname, searchParams]);

  const checkAuthorization = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isChecking: true, error: null }));

      // Wait for auth context to finish loading
      if (isLoading) {
        return;
      }

      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        handleAuthError('Authentication required');
        handleRedirect(redirectTo || '/auth/login', 'authentication_required');
        return;
      }

      // If auth not required and user not authenticated, allow access
      if (!requireAuth && !isAuthenticated) {
        setAuthState({
          isChecking: false,
          isAuthorized: true,
          error: null,
          redirecting: false
        });
        return;
      }

      // If we reach here, user is authenticated
      if (user) {
        // Check email verification requirement
        if (requireEmailVerification && !user.emailVerified) {
          handleAuthError('Email verification required');
          handleRedirect('/auth/verify-email', 'email_verification_required');
          return;
        }

        // Check role-based access
        if (allowedRoles.length > 0) {
          const userRole = claims?.role || user.role || 'customer';
          if (!allowedRoles.includes(userRole)) {
            handleAuthError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
            handleRedirect('/unauthorized', 'insufficient_permissions');
            return;
          }
        }

        // All checks passed
        setAuthState({
          isChecking: false,
          isAuthorized: true,
          error: null,
          redirecting: false
        });
        
        onAuthSuccess?.(user);
      }
    } catch (error) {
      console.error('[AUTH_GUARD] Authorization check failed:', error);
      handleAuthError('Authorization check failed');
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    claims,
    requireAuth,
    requireEmailVerification,
    allowedRoles,
    redirectTo,
    handleAuthError,
    handleRedirect,
    onAuthSuccess
  ]);

  useEffect(() => {
    checkAuthorization();
  }, [checkAuthorization]);

  // Show loading state
  if (authState.isChecking || authState.redirecting || isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return <AuthLoadingSpinner message="Verifying authentication..." />;
  }

  // Show error state
  if (authState.error && !authState.redirecting) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <AuthErrorBoundary
        error={authState.error}
        onRetry={checkAuthorization}
        onRedirect={() => handleRedirect('/auth/login', 'retry_authentication')}
      />
    );
  }

  // Show content if authorized
  if (authState.isAuthorized) {
    return <>{children}</>;
  }

  // Fallback - should not reach here
  return <AuthLoadingSpinner message="Checking authorization..." />;
}

/**
 * Higher-order component for page protection
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardOptions: Omit<AuthGuardProps, 'children'> = {}
) {
  const AuthGuardedComponent = (props: P) => {
    return (
      <AuthGuard {...guardOptions}>
        <Component {...props} />
      </AuthGuard>
    );
  };

  AuthGuardedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return AuthGuardedComponent;
}

/**
 * Hook for checking authentication status in components
 */
export function useAuthGuard(options: {
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
} = {}) {
  const { user, isLoading, isAuthenticated, claims } = useAuth();
  const [status, setStatus] = useState<{
    isAuthorized: boolean;
    isChecking: boolean;
    error: string | null;
  }>({
    isAuthorized: false,
    isChecking: true,
    error: null
  });

  useEffect(() => {
    const checkAuth = () => {
      if (isLoading) {
        setStatus(prev => ({ ...prev, isChecking: true }));
        return;
      }

      const {
        requireAuth = true,
        requireEmailVerification = false,
        allowedRoles = []
      } = options;

      // Check authentication
      if (requireAuth && !isAuthenticated) {
        setStatus({
          isAuthorized: false,
          isChecking: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!requireAuth && !isAuthenticated) {
        setStatus({
          isAuthorized: true,
          isChecking: false,
          error: null
        });
        return;
      }

      if (user) {
        // Check email verification
        if (requireEmailVerification && !user.emailVerified) {
          setStatus({
            isAuthorized: false,
            isChecking: false,
            error: 'Email verification required'
          });
          return;
        }

        // Check roles
        if (allowedRoles.length > 0) {
          const userRole = claims?.role || user.role || 'customer';
          if (!allowedRoles.includes(userRole)) {
            setStatus({
              isAuthorized: false,
              isChecking: false,
              error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
            return;
          }
        }

        setStatus({
          isAuthorized: true,
          isChecking: false,
          error: null
        });
      }
    };

    checkAuth();
  }, [isLoading, isAuthenticated, user, claims, options]);

  return status;
}

/**
 * Component for protecting specific UI elements
 */
export function ProtectedComponent({
  children,
  fallback = null,
  requireAuth = true,
  requireEmailVerification = false,
  allowedRoles = [],
  showError = false
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  allowedRoles?: string[];
  showError?: boolean;
}) {
  const { isAuthorized, error } = useAuthGuard({
    requireAuth,
    requireEmailVerification,
    allowedRoles
  });

  if (!isAuthorized) {
    if (showError && error) {
      return (
        <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}