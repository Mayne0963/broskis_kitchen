"use client"

import { useCallback, useState } from 'react'
import { getSessionCookie } from '@/lib/auth/session'
import { auth } from '@/lib/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export interface AuthVerificationResult {
  success: boolean
  authenticated: boolean
  user: {
    uid: string
    email: string
    emailVerified: boolean
    role?: string
  } | null
  error?: string
  timestamp: number
}

export interface AuthVerificationOptions {
  timeout?: number
  retryOnFailure?: boolean
  maxRetries?: number
  includeFirebase?: boolean
  includeNextAuth?: boolean
}

export function useAuthVerification() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastResult, setLastResult] = useState<AuthVerificationResult | null>(null)

  const verifyAuthStatus = useCallback(async (
    options: AuthVerificationOptions = {}
  ): Promise<AuthVerificationResult> => {
    const {
      timeout = 5000,
      retryOnFailure = true,
      maxRetries = 2,
      includeFirebase = true,
      includeNextAuth = true
    } = options

    setIsVerifying(true)

    try {
      const result = await performAuthVerification({
        timeout,
        includeFirebase,
        includeNextAuth
      })

      setLastResult(result)
      return result

    } catch (error) {
      const errorResult: AuthVerificationResult = {
        success: false,
        authenticated: false,
        user: null,
        error: error instanceof Error ? error.message : 'Authentication verification failed',
        timestamp: Date.now()
      }

      setLastResult(errorResult)

      // Retry logic
      if (retryOnFailure && maxRetries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return verifyAuthStatus({
          ...options,
          maxRetries: maxRetries - 1,
          retryOnFailure: maxRetries > 1
        })
      }

      return errorResult
    } finally {
      setIsVerifying(false)
    }
  }, [])

  return {
    verifyAuthStatus,
    isVerifying,
    lastResult
  }
}

async function performAuthVerification(options: {
  timeout: number
  includeFirebase: boolean
  includeNextAuth: boolean
}): Promise<AuthVerificationResult> {
  const { timeout, includeFirebase, includeNextAuth } = options

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Authentication verification timeout'))
    }, timeout)

    const checkAuth = async () => {
      try {
        let nextAuthUser = null
        let firebaseUser = null

        // Check NextAuth session
        if (includeNextAuth) {
          try {
            const response = await fetch('/api/auth/status', {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            })

            if (response.ok) {
              const data = await response.json()
              if (data.authenticated && data.user) {
                nextAuthUser = data.user
              }
            }
          } catch (error) {
            console.warn('NextAuth verification failed:', error)
          }
        }

        // Check Firebase auth
        if (includeFirebase) {
          try {
            firebaseUser = await new Promise((resolve) => {
              const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe()
                resolve(user)
              })

              // Timeout for Firebase check
              setTimeout(() => {
                unsubscribe()
                resolve(null)
              }, 2000)
            })
          } catch (error) {
            console.warn('Firebase verification failed:', error)
          }
        }

        clearTimeout(timeoutId)

        // Determine final auth state
        const authenticated = !!(nextAuthUser || firebaseUser)
        const user = nextAuthUser || (firebaseUser ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          emailVerified: firebaseUser.emailVerified || false
        } : null)

        resolve({
          success: true,
          authenticated,
          user,
          timestamp: Date.now()
        })

      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    }

    checkAuth()
  })
}

// Server-side auth verification (for use in server components)
export async function verifyAuthServerSide(): Promise<AuthVerificationResult> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/auth/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Don't cache
    })

    if (!response.ok) {
      throw new Error(`Auth verification failed: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      authenticated: data.authenticated,
      user: data.user,
      timestamp: Date.now()
    }

  } catch (error) {
    return {
      success: false,
      authenticated: false,
      user: null,
      error: error instanceof Error ? error.message : 'Server-side auth verification failed',
      timestamp: Date.now()
    }
  }
}