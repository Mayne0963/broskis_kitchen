"use client"

import { AlertTriangle, RefreshCw, Home, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AuthErrorStateProps {
  error: string
  retry?: () => void
  showHomeButton?: boolean
  showLoginButton?: boolean
}

export function AuthErrorState({ 
  error, 
  retry,
  showHomeButton = true,
  showLoginButton = true
}: AuthErrorStateProps) {
  const router = useRouter()
  
  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'authentication_required':
        return {
          title: 'Authentication Required',
          message: 'You need to sign in to access this page.',
          suggestion: 'Please log in to continue.'
        }
      case 'email_verification_required':
        return {
          title: 'Email Verification Required',
          message: 'Please verify your email address to access this feature.',
          suggestion: 'Check your inbox for a verification link.'
        }
      case 'insufficient_permissions':
        return {
          title: 'Access Denied',
          message: 'You don\'t have permission to access this page.',
          suggestion: 'Contact support if you believe this is an error.'
        }
      case 'session_expired':
        return {
          title: 'Session Expired',
          message: 'Your session has expired for security reasons.',
          suggestion: 'Please sign in again to continue.'
        }
      case 'authentication_failed':
        return {
          title: 'Authentication Failed',
          message: 'We couldn\'t verify your identity.',
          suggestion: 'Please try signing in again.'
        }
      default:
        return {
          title: 'Authentication Error',
          message: error || 'An unexpected authentication error occurred.',
          suggestion: 'Please try again or contact support if the problem persists.'
        }
    }
  }
  
  const errorInfo = getErrorMessage(error)
  
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-4">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 font-playfair">
            Broski's Kitchen
          </h1>
          <p className="text-gray-400 text-sm mt-2">Luxury Street Gourmet</p>
        </div>
        
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="bg-red-900/20 rounded-full p-4">
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
        </div>
        
        {/* Error Content */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-red-400">
            {errorInfo.title}
          </h2>
          <p className="text-gray-300">
            {errorInfo.message}
          </p>
          <p className="text-gray-400 text-sm">
            {errorInfo.suggestion}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {retry && (
            <button 
              onClick={retry}
              className="flex items-center justify-center gap-2 bg-yellow-400 text-black px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
          
          {showLoginButton && (
            <button 
              onClick={() => router.push('/auth/login')}
              className="flex items-center justify-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          )}
          
          {showHomeButton && (
            <button 
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 border border-gray-600 text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <Home className="h-4 w-4" />
              Go Home
            </button>
          )}
        </div>
        
        {/* Support Link */}
        <div className="pt-4 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            Need help?{' '}
            <button 
              onClick={() => router.push('/contact')}
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// Inline error component for smaller spaces
export function InlineAuthError({ 
  error, 
  retry, 
  compact = false 
}: { 
  error: string
  retry?: () => void
  compact?: boolean 
}) {
  if (compact) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-center">
        <p className="text-red-400 text-sm mb-2">{error}</p>
        {retry && (
          <button 
            onClick={retry}
            className="text-yellow-400 hover:text-yellow-300 text-sm underline"
          >
            Try Again
          </button>
        )}
      </div>
    )
  }
  
  return (
    <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center space-y-4">
      <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
      <div>
        <h3 className="text-red-400 font-medium mb-2">Authentication Error</h3>
        <p className="text-gray-300 text-sm">{error}</p>
      </div>
      {retry && (
        <button 
          onClick={retry}
          className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  )
}