import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

export class CSRFProtection {
  private static instance: CSRFProtection
  private tokenStore = new Map<string, { token: string, expiry: number }>()
  private readonly tokenTTL = 60 * 60 * 1000 // 1 hour

  private constructor() {}

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection()
    }
    return CSRFProtection.instance
  }

  generateToken(): string {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex')
  }

  createTokenForSession(sessionId: string): string {
    const token = this.generateToken()
    const expiry = Date.now() + this.tokenTTL
    
    this.tokenStore.set(sessionId, { token, expiry })
    
    // Cleanup expired tokens
    this.cleanup()
    
    return token
  }

  validateToken(sessionId: string, providedToken: string): boolean {
    const stored = this.tokenStore.get(sessionId)
    
    if (!stored) {
      return false
    }

    if (Date.now() > stored.expiry) {
      this.tokenStore.delete(sessionId)
      return false
    }

    return crypto.timingSafeEqual(
      Buffer.from(stored.token, 'hex'),
      Buffer.from(providedToken, 'hex')
    )
  }

  removeToken(sessionId: string): void {
    this.tokenStore.delete(sessionId)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [sessionId, data] of this.tokenStore.entries()) {
      if (now > data.expiry) {
        this.tokenStore.delete(sessionId)
      }
    }
  }
}

export const csrfProtection = CSRFProtection.getInstance()

// Middleware function to add CSRF token to response
export function addCSRFToken(request: NextRequest, response: NextResponse): NextResponse {
  try {
    const sessionId = request.cookies.get('session')?.value
    
    if (sessionId) {
      const token = csrfProtection.createTokenForSession(sessionId)
      
      // Add token to response headers
      response.headers.set('X-CSRF-Token', token)
      
      // Set secure cookie with token
      response.cookies.set(CSRF_TOKEN_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 // 1 hour
      })
    }
    
    return response
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return response
  }
}

// Middleware function to validate CSRF token
export function validateCSRFToken(request: NextRequest): boolean {
  try {
    // Skip CSRF validation for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true
    }

    const sessionId = request.cookies.get('session')?.value
    const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME)
    const tokenFromCookie = request.cookies.get(CSRF_TOKEN_NAME)?.value

    if (!sessionId) {
      return false
    }

    // Check token from header first, then cookie
    const providedToken = tokenFromHeader || tokenFromCookie
    
    if (!providedToken) {
      return false
    }

    return csrfProtection.validateToken(sessionId, providedToken)
  } catch (error) {
    console.error('CSRF validation error:', error)
    return false
  }
}

// React hook for CSRF token management
export function useCSRFToken() {
  const [token, setToken] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Get token from cookie or fetch from server
    const getToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const csrfToken = response.headers.get('X-CSRF-Token')
          if (csrfToken) {
            setToken(csrfToken)
          }
        }
      } catch (error) {
        console.error('Failed to get CSRF token:', error)
      }
    }

    getToken()
  }, [])

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers[CSRF_HEADER_NAME] = token
    }
    
    return headers
  }

  return {
    token,
    getHeaders
  }
}

// Utility function for making CSRF-protected requests
export async function csrfFetch(url: string, options: RequestInit = {}) {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CSRF_TOKEN_NAME}=`))
    ?.split('=')[1]

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token && !['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET')) {
    headers[CSRF_HEADER_NAME] = token
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })
}

// Import React for the hook
import React from 'react'