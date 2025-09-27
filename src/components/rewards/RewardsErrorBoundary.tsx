"use client"

import React, { Component, ReactNode } from 'react'
import { toast } from 'sonner'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class RewardsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Rewards Error Boundary caught an error:', error, errorInfo)
    
    // Show user-friendly toast notification
    toast.error('Something went wrong with the rewards section. Please try refreshing the page.')
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
              <p className="text-gray-400 mb-6">
                We encountered an issue loading the rewards section. This might be a temporary problem.
              </p>
            </div>
            
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-6 py-3 bg-turquoise-500 hover:bg-turquoise-600 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>If this problem persists, please contact support.</p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}