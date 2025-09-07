'use client'

import { useAuth } from '@/lib/context/AuthContext'
import { useState } from 'react'
import { toast } from 'sonner'

// Toast throttling to prevent spam
let lastToastAt = 0
function safeToast(kind: "success" | "error", message: string, description?: string) {
  const now = Date.now()
  if (now - lastToastAt < 5000) return
  lastToastAt = now
  const fullMessage = description ? `${message}: ${description}` : message
  if (kind === "success") toast.success(fullMessage)
  else toast.error(fullMessage)
}

// Backoff state for quota exceeded errors
let quotaExceededBackoff = false
let backoffUntil = 0

export default function AuthDebugPage() {
  const { user, claims, loading } = useAuth()
  const [debugData, setDebugData] = useState<any>(null)
  const [debugLoading, setDebugLoading] = useState(false)

  const fetchDebugData = async () => {
    setDebugLoading(true)
    try {
      const response = await fetch('/api/debug/auth')
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error('Failed to fetch debug data:', error)
      setDebugData({ error: 'Failed to fetch debug data' })
    } finally {
      setDebugLoading(false)
    }
  }

  const refreshUserToken = async () => {
    if (user) {
      // Check if we're in backoff period
      const now = Date.now()
      if (quotaExceededBackoff && now < backoffUntil) {
        safeToast("error", "Refresh Failed", "Please wait before trying again due to rate limits.")
        return
      }
      
      try {
        // Force refresh the user token
        const auth = (await import('firebase/auth')).getAuth()
        const currentUser = auth.currentUser
        if (currentUser) {
          const token = await currentUser.getIdToken(true)
          console.log('Refreshed token:', token.substring(0, 50) + '...')
          
          // Update session cookie
          const response = await fetch('/api/auth/session-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken: token }),
          })
          
          if (response.ok) {
            console.log('Session cookie updated successfully')
            safeToast("success", "Permissions Updated", "Your account permissions have been refreshed.")
            // Reset backoff state on success
            quotaExceededBackoff = false
            backoffUntil = 0
            // Refresh debug data
            fetchDebugData()
          } else {
            console.error('Failed to update session cookie')
            safeToast("error", "Refresh Failed", "Failed to update session cookie.")
          }
        }
      } catch (error: any) {
        console.error('Failed to refresh token:', error)
        
        // Check for quota exceeded error and implement backoff
        if (error?.code === 'auth/quota-exceeded') {
          quotaExceededBackoff = true
          backoffUntil = now + 60000 // 1 minute backoff
          safeToast("error", "Refresh Failed", "Rate limit exceeded. Please wait before trying again.")
        } else {
          safeToast("error", "Refresh Failed", "Failed to refresh account permissions.")
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Client-side Auth State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Client-side Auth State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User exists:</strong> {user ? 'Yes' : 'No'}</p>
              {user && (
                <>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Role:</strong> {claims.role || 'customer'}</p>
                  <p><strong>Is Admin:</strong> {claims.role === 'admin' ? 'Yes' : 'No'}</p>
                  <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                  <p><strong>Kitchen Access:</strong> {claims.role === 'kitchen' || claims.role === 'admin' ? 'Yes' : 'No'}</p>
                </>
              )}
            </div>
            
            <div className="mt-4 space-x-2">
              <button
                onClick={refreshUserToken}
                disabled={!user}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                Refresh Token & Session
              </button>
            </div>
          </div>

          {/* Server-side Debug */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Server-side Debug</h2>
            <button
              onClick={fetchDebugData}
              disabled={debugLoading}
              className="mb-4 px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
            >
              {debugLoading ? 'Loading...' : 'Fetch Server Debug Data'}
            </button>
            
            {debugData && (
              <div className="space-y-2 text-sm">
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <a
              href="/admin"
              className="inline-block px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Try Admin Dashboard
            </a>
            <a
              href="/auth/login"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login
            </a>
            <a
              href="/dashboard"
              className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}