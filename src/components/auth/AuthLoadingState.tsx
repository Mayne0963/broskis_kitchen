"use client"

import { Loader2 } from 'lucide-react'

interface AuthLoadingStateProps {
  message?: string
  showLogo?: boolean
}

export function AuthLoadingState({ 
  message = "Verifying Authentication", 
  showLogo = true 
}: AuthLoadingStateProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-4">
        {showLogo && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-yellow-400 font-playfair">
              Broski's Kitchen
            </h1>
            <p className="text-gray-400 text-sm mt-2">Luxury Street Gourmet</p>
          </div>
        )}
        
        <div className="flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-yellow-400 animate-spin" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{message}</h2>
          <p className="text-gray-400">
            Please wait while we verify your session...
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="w-full bg-gray-800 rounded-full h-1">
          <div className="bg-yellow-400 h-1 rounded-full animate-pulse w-1/3"></div>
        </div>
      </div>
    </div>
  )
}

// Skeleton loading for protected content
export function AuthContentSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-800 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-800 rounded w-32 animate-pulse"></div>
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-lg p-6 space-y-4">
              <div className="h-4 bg-gray-800 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2 animate-pulse"></div>
              <div className="h-20 bg-gray-800 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Inline loading spinner for smaller components
export function InlineAuthLoader({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }
  
  return (
    <div className="flex items-center justify-center p-2">
      <Loader2 className={`${sizeClasses[size]} text-yellow-400 animate-spin`} />
    </div>
  )
}