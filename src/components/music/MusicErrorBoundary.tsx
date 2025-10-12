'use client'

import React from 'react';

interface MusicErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface MusicErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class MusicErrorBoundary extends React.Component<MusicErrorBoundaryProps, MusicErrorBoundaryState> {
  constructor(props: MusicErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MusicErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Music player error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <div className="text-red-400 mb-4">
            <span className="text-4xl">🎵</span>
          </div>
          <h3 className="text-red-400 text-lg font-semibold mb-2">Music Player Error</h3>
          <p className="text-gray-300 text-sm mb-4">
            Something went wrong with the music player. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}