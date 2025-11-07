"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useAuth } from './AuthContext'
import { useAuthCache } from '@/lib/hooks/useAuthCache'
// useAuthPerformance is exported from useAuthCache.ts
import { useAuthPerformance } from '@/lib/hooks/useAuthCache'

export interface AuthLoadingState {
  isAuthReady: boolean
  isVerifying: boolean
  hasError: boolean
  error: string | null
  authCheckComplete: boolean
  retryCount: number
}

export interface AuthLoadingContextType extends AuthLoadingState {
  verifyAuth: () => Promise<void>
  resetAuthState: () => void
  retryAuthVerification: () => Promise<void>
}

const AuthLoadingContext = createContext<AuthLoadingContextType | undefined>(undefined)

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

export function AuthLoadingProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession()
  const { user: firebaseUser, loading: firebaseLoading, isAuthenticated } = useAuth()
  const { getCachedAuth, setCachedAuth, isCacheValid, clearAuthCache } = useAuthCache()
  const { recordCacheHit, recordCacheMiss, recordVerification, getMetrics } = useAuthPerformance()
  
  const [authState, setAuthState] = useState<AuthLoadingState>({
    isAuthReady: false,
    isVerifying: true,
    hasError: false,
    error: null,
    authCheckComplete: false,
    retryCount: 0
  })

  const verifyAuth = useCallback(async (): Promise<void> => {
    const startTime = Date.now()
    
    try {
      setAuthState(prev => ({ 
        ...prev, 
        isVerifying: true, 
        hasError: false, 
        error: null 
      }))

      // Check cache first
      const sessionId = session?.user?.id || session?.user?.email
      if (isCacheValid(sessionId)) {
        const cached = getCachedAuth(sessionId)
        if (cached) {
          recordCacheHit()
          recordVerification(Date.now() - startTime)
          
          setAuthState(prev => ({
            ...prev,
            isAuthReady: true,
            isVerifying: false,
            authCheckComplete: true,
            hasError: false,
            error: null
          }))
          return
        }
      }

      recordCacheMiss()

      // Wait for both NextAuth and Firebase auth to stabilize
      const maxWaitTime = 5000 // 5 seconds timeout
      const waitStartTime = Date.now()
      
      while (Date.now() - waitStartTime < maxWaitTime) {
        // Check if we have a definitive auth state
        const nextAuthReady = sessionStatus !== 'loading'
        const firebaseReady = !firebaseLoading
        
        if (nextAuthReady && firebaseReady) {
          // Both auth systems have stabilized
          const verificationTime = Date.now() - startTime
          recordVerification(verificationTime)
          
          // Cache the result
          const user = session?.user ? {
            uid: (session.user as any).uid || session.user.id,
            email: session.user.email || '',
            emailVerified: (session.user as any).emailVerified || false,
            role: (session.user as any).role
          } : null
          
          setCachedAuth(!!session?.user || isAuthenticated, user, sessionId)
          
          setAuthState(prev => ({
            ...prev,
            isAuthReady: true,
            isVerifying: false,
            authCheckComplete: true,
            hasError: false,
            error: null
          }))
          return
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Timeout reached
      throw new Error('Authentication verification timeout')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication verification failed'
      const verificationTime = Date.now() - startTime
      recordVerification(verificationTime)
      
      setAuthState(prev => ({
        ...prev,
        isAuthReady: false,
        isVerifying: false,
        hasError: true,
        error: errorMessage,
        authCheckComplete: true
      }))
      
      // Auto-retry on certain errors
      if (authState.retryCount < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          retryAuthVerification()
        }, RETRY_DELAY)
      }
    }
  }, [sessionStatus, firebaseLoading, authState.retryCount, session?.user, isAuthenticated, getCachedAuth, setCachedAuth, isCacheValid, recordCacheHit, recordCacheMiss, recordVerification])

  const retryAuthVerification = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }))
    await verifyAuth()
  }, [verifyAuth])

  const resetAuthState = useCallback(() => {
    // Clear cache when resetting auth state
    const sessionId = session?.user?.id || session?.user?.email
    clearAuthCache(sessionId)
    
    setAuthState({
      isAuthReady: false,
      isVerifying: true,
      hasError: false,
      error: null,
      authCheckComplete: false,
      retryCount: 0
    })
  }, [session?.user, clearAuthCache])

  // Trigger auth verification on mount and when auth states change
  useEffect(() => {
    verifyAuth()
  }, [verifyAuth])

  // Monitor auth state changes and re-verify if needed
  useEffect(() => {
    if (authState.authCheckComplete && !authState.isVerifying) {
      // Check if auth state has changed significantly
      const currentAuthState = {
        hasNextAuthSession: !!session?.user,
        hasFirebaseUser: !!firebaseUser,
        isAuthenticated
      }
      
      // If auth state changes after verification, re-verify
      if (authState.isAuthReady) {
        // This would be a significant auth state change
        if (!currentAuthState.hasNextAuthSession && !currentAuthState.hasFirebaseUser && currentAuthState.isAuthenticated) {
          verifyAuth()
        }
      }
    }
  }, [session?.user, firebaseUser, isAuthenticated, authState, verifyAuth])

  const contextValue: AuthLoadingContextType = {
    ...authState,
    verifyAuth,
    resetAuthState,
    retryAuthVerification
  }

  return (
    <AuthLoadingContext.Provider value={contextValue}>
      {children}
    </AuthLoadingContext.Provider>
  )
}

export function useAuthLoading() {
  const context = useContext(AuthLoadingContext)
  if (context === undefined) {
    throw new Error('useAuthLoading must be used within an AuthLoadingProvider')
  }
  return context
}