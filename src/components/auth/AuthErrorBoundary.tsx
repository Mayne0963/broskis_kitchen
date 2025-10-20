'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, LogIn, Shield, ChefHat } from 'lucide-react';

interface AuthErrorBoundaryProps {
  children?: ReactNode;
  error?: string;
  onRetry?: () => void;
  onRedirect?: () => void;
  fallback?: ReactNode;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Authentication Error Boundary with Broski's Kitchen branding
 */
export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AUTH_ERROR_BOUNDARY] Authentication error caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError || this.props.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <AuthErrorDisplay
          error={this.props.error || this.state.error?.message || 'Authentication error occurred'}
          onRetry={this.handleRetry}
          onRedirect={this.props.onRedirect}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Authentication Error Display Component
 */
export function AuthErrorDisplay({
  error,
  onRetry,
  onRedirect,
  variant = 'default'
}: {
  error: string;
  onRetry?: () => void;
  onRedirect?: () => void;
  variant?: 'default' | 'minimal' | 'fullscreen';
}) {
  const getErrorDetails = (error: string) => {
    const errorMap: Record<string, { title: string; description: string; action: string }> = {
      'authentication_required': {
        title: 'Authentication Required',
        description: 'You need to sign in to access this page.',
        action: 'Sign In'
      },
      'email_verification_required': {
        title: 'Email Verification Required',
        description: 'Please verify your email address to continue.',
        action: 'Verify Email'
      },
      'insufficient_permissions': {
        title: 'Access Denied',
        description: 'You don\'t have permission to access this resource.',
        action: 'Go Home'
      },
      'session_expired': {
        title: 'Session Expired',
        description: 'Your session has expired. Please sign in again.',
        action: 'Sign In Again'
      },
      'network_error': {
        title: 'Connection Error',
        description: 'Unable to connect to our servers. Please check your internet connection.',
        action: 'Retry'
      }
    };

    const key = Object.keys(errorMap).find(k => error.toLowerCase().includes(k)) || 'default';
    return errorMap[key] || {
      title: 'Authentication Error',
      description: error || 'An unexpected error occurred during authentication.',
      action: 'Try Again'
    };
  };

  const errorDetails = getErrorDetails(error);

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">{errorDetails.title}</h3>
              <p className="text-sm text-red-600 mt-1">{errorDetails.description}</p>
              <div className="mt-3 flex space-x-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
                  >
                    Retry
                  </button>
                )}
                {onRedirect && (
                  <button
                    onClick={onRedirect}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                  >
                    {errorDetails.action}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center space-y-8 max-w-lg mx-auto px-6">
          {/* Error Icon with Branding */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Brand Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Broski's Kitchen</h1>
            <p className="text-gray-600">Authentic Caribbean Flavors</p>
          </div>

          {/* Error Details */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-red-600">{errorDetails.title}</h2>
            <p className="text-gray-700 text-lg">{errorDetails.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}
            {onRedirect && (
              <button
                onClick={onRedirect}
                className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>{errorDetails.action}</span>
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </button>
          </div>

          {/* Security Footer */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>Your security is our priority</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center justify-center p-6">
      <div className="bg-white border border-red-200 rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center space-y-4 mb-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{errorDetails.title}</h3>
            <p className="text-gray-600 mt-2">{errorDetails.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}
          {onRedirect && (
            <button
              onClick={onRedirect}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>{errorDetails.action}</span>
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </button>
        </div>

        {/* Branding Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <ChefHat className="w-3 h-3" />
            <span>Broski's Kitchen - Secure Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error component for smaller spaces
 */
export function InlineAuthError({
  error,
  onRetry,
  size = 'default'
}: {
  error: string;
  onRetry?: () => void;
  size?: 'small' | 'default';
}) {
  const isSmall = size === 'small';

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg ${isSmall ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className={`${isSmall ? 'w-4 h-4' : 'w-5 h-5'} text-red-500 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`${isSmall ? 'text-xs' : 'text-sm'} text-red-800 font-medium`}>
            Authentication Error
          </p>
          <p className={`${isSmall ? 'text-xs' : 'text-sm'} text-red-600 mt-1`}>
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className={`mt-2 ${isSmall ? 'text-xs' : 'text-sm'} bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors`}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Toast-style error notification
 */
export function AuthErrorToast({
  error,
  onDismiss,
  onRetry
}: {
  error: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-red-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800">Authentication Error</h4>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <div className="mt-3 flex space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
              >
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}