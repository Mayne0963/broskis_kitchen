"use client";

import React, { Component, ReactNode } from 'react';
import { logError } from '@/lib/utils/errorLogger'

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  digest?: string;
}

class ResourceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, digest: (error as any)?.digest };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const msg = error.message || '';
    const stack = (error as any).stack || '';
    const benign = (
      msg.includes('Resource failed to load') ||
      msg.includes('null is not an object') ||
      msg.includes('Cannot read properties of null')
    ) && (
      stack.includes('SchemaGenerator') ||
      stack.includes('ImageOptimizationEnhancer') ||
      stack.includes('SEOAudit')
    );
    if (benign) {
      this.setState({ hasError: false });
      return;
    }
    try {
      logError(error, {
        boundary: 'ResourceErrorBoundary',
        componentStack: errorInfo.componentStack
      })
    } catch {}
  }

  componentDidMount() {
    // Global error handler for unhandled resource errors
    window.addEventListener('error', (event) => {
      if (event.message?.includes('Resource failed to load')) {
        console.warn('Global resource loading error:', event.message);
        event.preventDefault(); // Prevent default error handling
      }
    });
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || 'An unexpected error occurred.'
      const digest = this.state.digest || 'N/A'
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center space-y-4 max-w-md mx-auto px-6">
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-gray-300">{message}</p>
            <div className="text-xs text-gray-500">Error ID: {digest}</div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-lg hover:bg-[#E6C200]"
              >
                Reload
              </button>
              <button
                onClick={() => { try { this.setState({ hasError: false, error: undefined, digest: undefined }) } catch {} }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-600 text-white rounded-lg hover:bg-gray-800"
              >
                Retry
              </button>
              <button
                onClick={() => { try { window.location.href = '/' } catch {} }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#FFD700] text-[#FFD700] rounded-lg hover:bg-[#FFD700] hover:text-black"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ResourceErrorBoundary;
