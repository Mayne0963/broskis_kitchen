'use client'

import { useEffect, useState } from 'react'

interface SessionGateProps {
  children: React.ReactNode
}

export default function SessionGate({ children }: SessionGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return;
    
    let inFlightPromise: Promise<Response> | null = null
    let timeoutId: NodeJS.Timeout | null = null

    const checkAuth = async () => {
      try {
        // Use debounced in-flight promise to avoid multiple concurrent requests
        if (!inFlightPromise) {
          inFlightPromise = fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          })
          
          // Clear the in-flight promise after a short delay
          timeoutId = setTimeout(() => {
            inFlightPromise = null
          }, 100)
        }
        
        const response = await inFlightPromise
        
        if (response.status === 204 || response.status === 200) {
          setIsAuthenticated(true)
        } else {
          // If auth fails, middleware should have already redirected
          // This is a fallback for edge cases
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Retry on network errors
        setTimeout(checkAuth, 1000)
      }
    }

    checkAuth()
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isClient])

  // Show loading skeleton during server-side rendering or while checking auth
  if (!isClient || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-6 w-1/3"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Only render children if authenticated
  // Middleware handles redirects for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-6 w-1/3"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}