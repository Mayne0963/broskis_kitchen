"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { LoadingSpinner } from './LoadingStates'

// Enhanced form loading state with progress
interface FormLoadingProps {
  isLoading: boolean
  progress?: number
  message?: string
  steps?: string[]
  currentStep?: number
}

export function FormLoading({ 
  isLoading, 
  progress = 0, 
  message = 'Processing...', 
  steps = [], 
  currentStep = 0 
}: FormLoadingProps) {
  if (!isLoading) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <motion.div
          className="mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-[#FFD700] mx-auto" />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-white mb-4">{message}</h3>
        
        {progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div 
                className="bg-[#FFD700] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
        
        {steps.length > 0 && (
          <div className="text-left">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Steps:</h4>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center text-sm">
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  ) : index === currentStep ? (
                    <Loader2 className="w-4 h-4 text-[#FFD700] mr-2 flex-shrink-0 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 border border-gray-600 rounded-full mr-2 flex-shrink-0" />
                  )}
                  <span className={index <= currentStep ? 'text-white' : 'text-gray-500'}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Network status indicator
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showStatus) return null

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg flex items-center gap-2 ${
          isOnline ? 'bg-green-600' : 'bg-red-600'
        } text-white`}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Back online' : 'No internet connection'}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}

// Enhanced error state with retry functionality
interface ErrorStateProps {
  error: Error | string
  onRetry?: () => void
  retryCount?: number
  maxRetries?: number
  showDetails?: boolean
  className?: string
}

export function ErrorState({ 
  error, 
  onRetry, 
  retryCount = 0, 
  maxRetries = 3, 
  showDetails = false,
  className = '' 
}: ErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const errorMessage = typeof error === 'string' ? error : error.message

  const handleRetry = async () => {
    if (!onRetry || retryCount >= maxRetries) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="mb-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <AlertCircle className="w-16 h-16 text-red-500" />
      </motion.div>
      
      <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
      <p className="text-gray-400 mb-6 max-w-md">{errorMessage}</p>
      
      {showDetails && typeof error !== 'string' && (
        <details className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-left max-w-2xl">
          <summary className="cursor-pointer text-red-400 font-medium mb-2">
            Error Details
          </summary>
          <pre className="text-xs text-red-300 overflow-auto">
            {error.stack || error.message}
          </pre>
        </details>
      )}
      
      {onRetry && retryCount < maxRetries && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] text-black font-medium rounded-lg hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50"
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
          
          {retryCount > 0 && (
            <p className="text-sm text-gray-500">
              Attempt {retryCount + 1} of {maxRetries + 1}
            </p>
          )}
        </div>
      )}
      
      {retryCount >= maxRetries && (
        <p className="text-sm text-red-400">
          Maximum retry attempts reached. Please refresh the page or contact support.
        </p>
      )}
    </motion.div>
  )
}

// Loading overlay for specific components
interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  children: React.ReactNode
  blur?: boolean
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  children, 
  blur = true 
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center z-10 ${
              blur ? 'backdrop-blur-sm' : ''
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <LoadingSpinner size="lg" className="text-[#FFD700] mb-4" />
              <p className="text-white font-medium">{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Skeleton loader with shimmer effect
interface SkeletonProps {
  className?: string
  count?: number
  height?: string
  width?: string
  circle?: boolean
}

export function Skeleton({ 
  className = '', 
  count = 1, 
  height = 'h-4', 
  width = 'w-full', 
  circle = false 
}: SkeletonProps) {
  const skeletonClass = `animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer ${
    circle ? 'rounded-full' : 'rounded'
  } ${height} ${width} ${className}`

  if (count === 1) {
    return <div className={skeletonClass} />
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} />
      ))}
    </div>
  )
}

// Progress indicator for multi-step processes
interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
  completedSteps?: number[]
  className?: string
}

export function ProgressIndicator({ 
  steps, 
  currentStep, 
  completedSteps = [], 
  className = '' 
}: ProgressIndicatorProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index)
        const isCurrent = index === currentStep
        const isUpcoming = index > currentStep

        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isCurrent
                    ? 'bg-[#FFD700] text-black'
                    : 'bg-gray-600 text-gray-400'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </motion.div>
              <span className={`mt-2 text-xs text-center max-w-20 ${
                isCurrent ? 'text-white font-medium' : 'text-gray-400'
              }`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                isCompleted ? 'bg-green-600' : 'bg-gray-600'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Hook for managing loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState)
  const [error, setError] = useState<Error | null>(null)

  const withLoading = async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await asyncFn()
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setIsLoading(false)
    setError(null)
  }

  return {
    isLoading,
    error,
    withLoading,
    reset,
    setIsLoading,
    setError
  }
}