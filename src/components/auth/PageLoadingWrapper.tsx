"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useAuthLoading } from '@/lib/context/AuthLoadingContext'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageLoadingWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  minLoadingTime?: number
  showProgressBar?: boolean
  className?: string
}

export function PageLoadingWrapper({ 
  children, 
  fallback,
  minLoadingTime = 800,
  showProgressBar = true,
  className
}: PageLoadingWrapperProps) {
  const { 
    isAuthReady, 
    isVerifying, 
    hasError, 
    error, 
    authCheckComplete,
    retryAuthVerification 
  } = useAuthLoading()
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine
  
  // Prevent transient error flash by gating until hard timeout elapses
  const suppressErrorFlash = isVerifying || (!isAuthReady && !authCheckComplete) || !isOnline
  
  const [showContent, setShowContent] = useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [errorReady, setErrorReady] = useState(false)

  // Ensure minimum loading time for smooth UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, minLoadingTime)

    return () => clearTimeout(timer)
  }, [minLoadingTime])

  // Show content only when auth is ready and minimum time has elapsed
  useEffect(() => {
    if (isAuthReady && minTimeElapsed && !isVerifying) {
      setShowContent(true)
    }
  }, [isAuthReady, minTimeElapsed, isVerifying])

  // Delay error display slightly to allow late stabilization / network recovery
  useEffect(() => {
    if (hasError && authCheckComplete) {
      setErrorReady(false)
      const t = setTimeout(() => setErrorReady(true), 1500)
      return () => clearTimeout(t)
    } else {
      setErrorReady(false)
    }
  }, [hasError, authCheckComplete])

  // Handle error state
  if (hasError && authCheckComplete && !suppressErrorFlash && errorReady && isOnline) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center bg-black", className)}>
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="flex justify-center">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Authentication Error</h2>
            <p className="text-gray-300">{error || 'Unable to verify your authentication status.'}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retryAuthVerification}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If offline, show an offline-specific loading message
  if (!isOnline) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center bg-black", className)}>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Waiting for connection…</h2>
            <p className="text-gray-400">You appear to be offline. Restoring network…</p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (!showContent || isVerifying) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className={cn("min-h-screen flex items-center justify-center bg-black", className)}>
        <div className="text-center space-y-6">
          {/* Main loading spinner */}
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          </div>
          
          {/* Loading text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Loading Broski's Kitchen</h2>
            <p className="text-gray-400">Verifying your session...</p>
          </div>

          {/* Progress bar */}
          {showProgressBar && (
            <div className="w-64 mx-auto">
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" 
                     style={{ width: isAuthReady ? '100%' : '60%' }} />
              </div>
            </div>
          )}

          {/* Additional loading states */}
          <div className="space-y-1 text-sm text-gray-500">
            <p>{isVerifying ? 'Checking authentication...' : 'Preparing your experience...'}</p>
            {!minTimeElapsed && <p>Almost ready...</p>}
          </div>
        </div>
      </div>
    )
  }

  // Render content when auth is ready
  return <>{children}</>
}

// Lightweight wrapper for minimal performance impact
export function AuthLoadingGate({ children }: { children: ReactNode }) {
  const { isAuthReady, hasError, authCheckComplete } = useAuthLoading()
  
  // Quick check - if auth is ready, render immediately
  if (isAuthReady && !hasError) {
    return <>{children}</>
  }
  
  // If there's an error, show error state
  if (hasError && authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-white">Authentication error</p>
        </div>
      </div>
    )
  }
  
  // Show minimal loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
    </div>
  )
}