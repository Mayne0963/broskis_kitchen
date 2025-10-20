import { auth } from '@/lib/firebase/config'
import { onAuthStateChanged, User } from 'firebase/auth'

export interface SessionState {
  user: User | null
  isAuthenticated: boolean
  isEmailVerified: boolean
  sessionExpiry: number | null
  lastRefresh: number
}

export interface SessionManagerOptions {
  refreshThreshold: number // Minutes before expiry to refresh
  maxRetries: number
  onSessionExpired?: () => void
  onRefreshError?: (error: Error) => void
}

class SessionManager {
  private static instance: SessionManager
  private sessionState: SessionState = {
    user: null,
    isAuthenticated: false,
    isEmailVerified: false,
    sessionExpiry: null,
    lastRefresh: Date.now()
  }
  
  private refreshTimer: NodeJS.Timeout | null = null
  private options: SessionManagerOptions = {
    refreshThreshold: 5, // 5 minutes
    maxRetries: 3
  }
  
  private listeners: Set<(state: SessionState) => void> = new Set()
  private isRefreshing = false
  private refreshPromise: Promise<void> | null = null

  private constructor(options?: Partial<SessionManagerOptions>) {
    if (options) {
      this.options = { ...this.options, ...options }
    }
    this.initializeAuthListener()
  }

  static getInstance(options?: Partial<SessionManagerOptions>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(options)
    }
    return SessionManager.instance
  }

  private initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      const newState: SessionState = {
        user,
        isAuthenticated: !!user,
        isEmailVerified: user?.emailVerified || false,
        sessionExpiry: user ? await this.getTokenExpiry(user) : null,
        lastRefresh: Date.now()
      }
      
      this.updateSessionState(newState)
      
      if (user) {
        this.scheduleTokenRefresh()
      } else {
        this.clearRefreshTimer()
      }
    })
  }

  private async getTokenExpiry(user: User): Promise<number | null> {
    try {
      const idTokenResult = await user.getIdTokenResult()
      return new Date(idTokenResult.expirationTime).getTime()
    } catch (error) {
      console.error('Failed to get token expiry:', error)
      return null
    }
  }

  private updateSessionState(newState: SessionState) {
    this.sessionState = newState
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.sessionState)
      } catch (error) {
        console.error('Session listener error:', error)
      }
    })
  }

  private scheduleTokenRefresh() {
    this.clearRefreshTimer()
    
    if (!this.sessionState.sessionExpiry) return
    
    const now = Date.now()
    const expiry = this.sessionState.sessionExpiry
    const refreshTime = expiry - (this.options.refreshThreshold * 60 * 1000)
    const timeUntilRefresh = Math.max(0, refreshTime - now)
    
    this.refreshTimer = setTimeout(() => {
      this.refreshSession()
    }, timeUntilRefresh)
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  async refreshSession(force = false): Promise<void> {
    if (this.isRefreshing && !force) {
      return this.refreshPromise || Promise.resolve()
    }

    if (!this.sessionState.user) {
      throw new Error('No user to refresh session for')
    }

    this.isRefreshing = true
    this.refreshPromise = this.performRefresh()
    
    try {
      await this.refreshPromise
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async performRefresh(): Promise<void> {
    let retries = 0
    
    while (retries < this.options.maxRetries) {
      try {
        if (!this.sessionState.user) {
          throw new Error('User not available for refresh')
        }

        // Force refresh the ID token
        await this.sessionState.user.getIdToken(true)
        
        // Update session cookie
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: await this.sessionState.user.getIdToken()
          })
        })

        if (!response.ok) {
          throw new Error(`Session refresh failed: ${response.statusText}`)
        }

        // Update session state
        const newExpiry = await this.getTokenExpiry(this.sessionState.user)
        this.updateSessionState({
          ...this.sessionState,
          sessionExpiry: newExpiry,
          lastRefresh: Date.now()
        })

        // Schedule next refresh
        this.scheduleTokenRefresh()
        return

      } catch (error) {
        retries++
        console.error(`Session refresh attempt ${retries} failed:`, error)
        
        if (retries >= this.options.maxRetries) {
          this.options.onRefreshError?.(error as Error)
          
          // If all retries failed, consider session expired
          if (this.isSessionExpired()) {
            this.handleSessionExpired()
          }
          throw error
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000))
      }
    }
  }

  private isSessionExpired(): boolean {
    if (!this.sessionState.sessionExpiry) return false
    return Date.now() >= this.sessionState.sessionExpiry
  }

  private handleSessionExpired() {
    this.clearRefreshTimer()
    this.options.onSessionExpired?.()
    
    // Clear session cookie
    fetch('/api/session', { method: 'DELETE' }).catch(console.error)
  }

  // Public methods
  getSessionState(): SessionState {
    return { ...this.sessionState }
  }

  isAuthenticated(): boolean {
    return this.sessionState.isAuthenticated && !this.isSessionExpired()
  }

  isEmailVerified(): boolean {
    return this.sessionState.isEmailVerified
  }

  getUser(): User | null {
    return this.sessionState.user
  }

  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener)
    
    // Immediately call with current state
    listener(this.sessionState)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  async checkSessionValidity(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      })
      
      return response.ok
    } catch (error) {
      console.error('Session validity check failed:', error)
      return false
    }
  }

  async forceRefresh(): Promise<void> {
    return this.refreshSession(true)
  }

  destroy() {
    this.clearRefreshTimer()
    this.listeners.clear()
    this.isRefreshing = false
    this.refreshPromise = null
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance({
  refreshThreshold: 5, // 5 minutes before expiry
  maxRetries: 3,
  onSessionExpired: () => {
    // Redirect to login or show session expired message
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login?reason=session_expired'
    }
  },
  onRefreshError: (error) => {
    console.error('Session refresh failed:', error)
    // Could show a toast notification here
  }
})

// React hook for using session manager
export function useSessionManager() {
  const [sessionState, setSessionState] = React.useState<SessionState>(
    sessionManager.getSessionState()
  )

  React.useEffect(() => {
    const unsubscribe = sessionManager.subscribe(setSessionState)
    return unsubscribe
  }, [])

  return {
    ...sessionState,
    refreshSession: () => sessionManager.forceRefresh(),
    checkValidity: () => sessionManager.checkSessionValidity(),
    isAuthenticated: sessionManager.isAuthenticated(),
    isEmailVerified: sessionManager.isEmailVerified()
  }
}

// Import React for the hook
import React from 'react'