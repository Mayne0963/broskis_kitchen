'use client'

import { useAuth } from '@/lib/context/AuthContext'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/services/firebase'
import { getIdTokenResult } from 'firebase/auth'

export default function TestAuthPage() {
  const { user, loading, isAdmin, isAuthenticated } = useAuth()
  const [firebaseUser, setFirebaseUser] = useState<any>(null)
  const [customClaims, setCustomClaims] = useState<any>(null)

  useEffect(() => {
    if (auth.currentUser) {
      setFirebaseUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified,
        displayName: auth.currentUser.displayName
      })
      
      // Get custom claims
      getIdTokenResult(auth.currentUser, true).then((idTokenResult) => {
        setCustomClaims(idTokenResult.claims)
      }).catch(console.error)
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AuthContext State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AuthContext State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
              <p><strong>Authenticated:</strong> {isAuthenticated ? 'true' : 'false'}</p>
              <p><strong>Is Admin:</strong> {isAdmin ? 'true' : 'false'}</p>
              <p><strong>User:</strong></p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>

          {/* Firebase Auth State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Firebase Auth State</h2>
            <div className="space-y-2">
              <p><strong>Firebase User:</strong></p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(firebaseUser, null, 2)}
              </pre>
              <p><strong>Custom Claims:</strong></p>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(customClaims, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <a 
            href="/admin" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Admin Page
          </a>
          <a 
            href="/auth/login" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-4"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  )
}