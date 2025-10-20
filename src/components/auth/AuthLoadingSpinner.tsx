'use client';

import React from 'react';
import { Loader2, ChefHat, Lock, Shield } from 'lucide-react';

export interface AuthLoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'branded';
  showIcon?: boolean;
}

/**
 * Authentication loading spinner with Broski's Kitchen branding
 */
export function AuthLoadingSpinner({
  message = 'Loading...',
  size = 'md',
  variant = 'default',
  showIcon = true
}: AuthLoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const containerClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center space-x-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-orange-500`} />
        {message && (
          <span className="text-sm text-gray-600">{message}</span>
        )}
      </div>
    );
  }

  if (variant === 'branded') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          {/* Broski's Kitchen Logo Animation */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <ChefHat className="w-10 h-10 text-white animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <Shield className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Brand Name */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Broski's Kitchen
            </h1>
            <p className="text-gray-600 text-sm">
              Authentic Caribbean Flavors
            </p>
          </div>

          {/* Loading Animation */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              <span className="text-gray-700 font-medium">{message}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>Secure Authentication</span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      <div className="text-center space-y-4">
        {showIcon && (
          <div className="flex items-center justify-center space-x-2">
            <div className="relative">
              <Loader2 className={`${sizeClasses[size]} animate-spin text-orange-500`} />
            </div>
          </div>
        )}
        
        {message && (
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">{message}</p>
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              <span>Broski's Kitchen - Secure Access</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Full-page authentication loading screen
 */
export function AuthLoadingPage({
  message = 'Verifying your access...',
  subtitle
}: {
  message?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="text-center space-y-8 max-w-lg mx-auto px-6">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-xl animate-pulse">
            <ChefHat className="w-12 h-12 text-white" />
          </div>
          
          {/* Rotating Security Ring */}
          <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-transparent border-t-orange-300 rounded-full animate-spin"></div>
          
          {/* Security Badge */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Shield className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Brand Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Broski's Kitchen
          </h1>
          <p className="text-gray-600">
            Authentic Caribbean Flavors & Catering
          </p>
        </div>

        {/* Loading Section */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">{message}</h2>
            {subtitle && (
              <p className="text-gray-600 text-sm">{subtitle}</p>
            )}
          </div>

          {/* Animated Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              <span className="text-gray-700 text-sm">Please wait...</span>
            </div>
            
            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full animate-pulse transition-all duration-1000" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>Your data is protected with enterprise-grade security</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline loading component for smaller spaces
 */
export function InlineAuthLoader({
  message = 'Loading...',
  size = 'sm'
}: {
  message?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return (
    <div className="flex items-center space-x-2">
      <Loader2 className={`${sizes[size]} animate-spin text-orange-500`} />
      <span className="text-gray-600 text-sm">{message}</span>
    </div>
  );
}

/**
 * Button loading state
 */
export function ButtonLoader({
  size = 'sm',
  className = ''
}: {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return (
    <Loader2 className={`${sizes[size]} animate-spin ${className}`} />
  );
}