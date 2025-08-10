"use client";

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ResourceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log resource loading errors
    if (error.message.includes('Resource failed to load')) {
      console.warn('Resource loading error caught:', error.message);
      // Don't crash the app for resource errors
      this.setState({ hasError: false });
      return;
    }
    
    console.error('ResourceErrorBoundary caught an error:', error, errorInfo);
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
      return this.props.fallback || (
        <div className="p-4 text-center text-gray-500">
          <p>Something went wrong. Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ResourceErrorBoundary;