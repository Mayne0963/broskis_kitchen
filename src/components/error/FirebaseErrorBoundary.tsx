"use client"

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  isOnline: boolean
  retryCount: number
}

export class FirebaseErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's a Firebase-related error
    const isFirebaseError = error.message.includes('firebase') ||
                           error.message.includes('firestore') ||
                           error.message.includes('auth') ||
                           error.stack?.includes('firebase')

    if (isFirebaseError) {
      return {
        hasError: true,
        error
      }
    }

    // Let other errors bubble up
    throw error
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Firebase Error Boundary caught error:', error, errorInfo)
  }

  componentDidMount() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  handleOnline = () => {
    this.setState({ isOnline: true })
    // Auto-retry when coming back online
    if (this.state.hasError) {
      this.handleRetry()
    }
  }

  handleOffline = () => {
    this.setState({ isOnline: false })
  }

  handleRetry = () => {
    if (this.state.retryCount >= 3) {
      return // Max retries reached
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1
    }))

    // Exponential backoff
    const delay = Math.pow(2, this.state.retryCount) * 1000

    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null
      })
    }, delay)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, isOnline, retryCount } = this.state
      const canRetry = retryCount < 3

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            {isOnline ? (
              <AlertTriangle className="w-8 h-8 text-red-500 mr-2" />
            ) : (
              <WifiOff className="w-8 h-8 text-red-500 mr-2" />
            )}
            <h3 className="text-lg font-semibold text-red-700">
              {isOnline ? 'Connection Error' : 'No Internet Connection'}
            </h3>
          </div>
          
          <p className="text-red-600 text-center mb-4">
            {isOnline 
              ? 'Unable to connect to our services. This might be a temporary issue.'
              : 'Please check your internet connection and try again.'
            }
          </p>

          {error && process.env.NODE_ENV === 'development' && (
            <details className="mb-4 p-2 bg-red-100 rounded text-sm">
              <summary className="cursor-pointer text-red-700 font-medium">
                Error Details
              </summary>
              <pre className="mt-2 text-red-600 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex items-center space-x-4">
            {!isOnline && (
              <div className="flex items-center text-red-600">
                <WifiOff className="w-4 h-4 mr-1" />
                <span className="text-sm">Offline</span>
              </div>
            )}
            
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                disabled={!isOnline}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry {retryCount > 0 && `(${retryCount}/3)`}
              </button>
            )}

            {!canRetry && (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </button>
            )}
          </div>

          {isOnline && (
            <div className="flex items-center mt-4 text-green-600">
              <Wifi className="w-4 h-4 mr-1" />
              <span className="text-sm">Connected</span>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export const useFirebaseErrorHandler = () => {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const handleFirebaseError = React.useCallback((error: Error) => {
    if (!isOnline) {
      console.warn('Firebase error while offline:', error.message)
      return
    }

    // Log Firebase errors for debugging
    if (error.message.includes('firebase') || error.message.includes('firestore')) {
      console.warn('Firebase connection error:', error.message)
    }
  }, [isOnline])

  return { isOnline, handleFirebaseError }
}