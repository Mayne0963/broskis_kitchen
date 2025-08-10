'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  digest?: string
}

class ProductionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      digest: (error as any).digest || 'No digest available'
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error details including digest
    console.error('ProductionErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      digest: (error as any).digest,
      errorInfo,
      componentStack: errorInfo.componentStack
    })

    // Store error info in state
    this.setState({
      error,
      errorInfo,
      digest: (error as any).digest || 'No digest available'
    })

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error monitoring services here
      // e.g., Sentry, LogRocket, etc.
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold text-[#FFD700] mb-4">Oops!</h1>
            <h2 className="text-xl mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-900 p-4 rounded-lg mb-6 text-left text-sm">
                <h3 className="text-[#FFD700] font-bold mb-2">Error Details:</h3>
                <p className="text-[var(--color-harvest-gold)] mb-2">Message: {this.state.error?.message}</p>
                <p className="text-[var(--color-harvest-gold)] mb-2">Digest: {this.state.digest}</p>
                {this.state.error?.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-400">Stack Trace</summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-400">Component Stack</summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold"
              >
                Reload Page
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ProductionErrorBoundary