"use client"

import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  title?: string
  description?: string
  showRetry?: boolean
  showHome?: boolean
  showBack?: boolean
  className?: string
}

export default function ErrorFallback({
  error,
  resetError,
  title = "Something went wrong",
  description = "We're sorry, but something unexpected happened. Please try again.",
  showRetry = true,
  showHome = true,
  showBack = false,
  className = ""
}: ErrorFallbackProps) {
  const router = useRouter()

  const handleRetry = () => {
    if (resetError) {
      resetError()
    } else {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <motion.div 
      className={`min-h-[400px] flex flex-col items-center justify-center p-8 text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
      </motion.div>
      
      <motion.h2 
        className="text-2xl font-bold text-white mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h2>
      
      <motion.p 
        className="text-gray-400 mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {description}
      </motion.p>
      
      {process.env.NODE_ENV === 'development' && error && (
        <motion.details 
          className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-left max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <summary className="cursor-pointer text-red-400 font-medium mb-2">
            Error Details (Development Only)
          </summary>
          <pre className="text-xs text-red-300 overflow-auto">
            {error.message}\n{error.stack}
          </pre>
        </motion.details>
      )}
      
      <motion.div 
        className="flex flex-wrap gap-4 justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {showRetry && (
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] text-black font-medium rounded-lg hover:bg-[#FFD700]/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        
        {showHome && (
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        )}
        
        {showBack && (
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}

// Specific error fallbacks for different scenarios
export function NetworkErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <ErrorFallback
      title="Connection Problem"
      description="We're having trouble connecting to our servers. Please check your internet connection and try again."
      resetError={resetError}
      showRetry={true}
      showHome={false}
    />
  )
}

export function PaymentErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <ErrorFallback
      title="Payment Issue"
      description="There was a problem processing your payment. Please try again or contact support if the issue persists."
      resetError={resetError}
      showRetry={true}
      showHome={true}
      showBack={true}
    />
  )
}

export function NotFoundFallback() {
  return (
    <ErrorFallback
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved."
      showRetry={false}
      showHome={true}
      showBack={true}
    />
  )
}

export function LoadingErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <ErrorFallback
      title="Loading Failed"
      description="We couldn't load this content. This might be a temporary issue."
      resetError={resetError}
      showRetry={true}
      showHome={false}
    />
  )
}