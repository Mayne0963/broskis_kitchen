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
      // Enhanced error logging for debugging
      console.error('🚨 ProductionErrorBoundary: Rendering error fallback', {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        digest: this.state.digest,
        timestamp: new Date().toISOString()
      });

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Force show error details for debugging (temporarily)
      const showErrorDetails = true; // Always show for debugging

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-900 text-white p-8">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-bold text-[#FFD700] mb-4">🚨 Error Detected</h1>
            <h2 className="text-xl mb-4">Application Error Boundary Triggered</h2>
            <p className="text-gray-300 mb-6">
              The application encountered an error. Error details are shown below for debugging.
            </p>
            
            {/* Always show error details for debugging */}
            {showErrorDetails && (
              <div className="bg-gray-900 p-4 rounded-lg mb-6 text-left text-sm max-w-full overflow-auto">
                <h3 className="text-[#FFD700] font-bold mb-2">🔍 Error Details:</h3>
                <p className="text-red-400 mb-2">
                  <strong>Message:</strong> {this.state.error?.message || 'No error message'}
                </p>
                <p className="text-yellow-400 mb-2">
                  <strong>Digest:</strong> {this.state.digest || 'No digest'}
                </p>
                <p className="text-blue-400 mb-2">
                  <strong>Environment:</strong> {process.env.NODE_ENV || 'unknown'}
                </p>
                
                {this.state.error?.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-green-400 font-bold">📋 Stack Trace</summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-60 bg-black p-2 rounded">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
                
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-purple-400 font-bold">🧩 Component Stack</summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-60 bg-black p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="mt-4 p-2 bg-yellow-900 rounded">
                  <p className="text-yellow-200 text-xs">
                    💡 <strong>Debug Tip:</strong> Check browser console for additional errors. 
                    This error boundary is temporarily showing all details for debugging.
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  console.log('🔄 Reloading page...');
                  if (process.env.DISABLE_FORCED_REFRESH !== "true") {
                    window.location.reload();
                  } else {
                    // Silent recovery - navigate to same page
                    window.location.href = window.location.href;
                  }
                }}
                className="bg-[#FFD700] hover:bg-[#E6C200] text-black font-bold"
              >
                🔄 Reload Page
              </Button>
              <Button 
                onClick={() => {
                  console.log('🏠 Going to home page...');
                  window.location.href = '/';
                }}
                variant="outline"
                className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black"
              >
                🏠 Go Home
              </Button>
              <Button 
                onClick={() => {
                  console.log('🧹 Clearing error state...');
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                }}
                variant="outline"
                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-black"
              >
                🧹 Clear Error & Retry
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