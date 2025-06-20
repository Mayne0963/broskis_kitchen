import { cookies } from 'next/headers'

export interface SessionUser {
  uid: string
  email: string
  emailVerified: boolean
  name?: string
  role: string
}

// Lightweight session parsing for middleware (Edge Runtime)
// This function only does basic JWT parsing without firebase-admin
export function getSessionCookieForMiddleware(): SessionUser | null {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) {
      return null
    }

    // Basic JWT payload extraction (not cryptographically verified)
    // This is only for route protection in middleware
    try {
      const payload = JSON.parse(atob(sessionCookie.split('.')[1]))
      return {
        uid: payload.uid,
        email: payload.email || '',
        emailVerified: payload.email_verified || false,
        name: payload.name || payload.email?.split('@')[0],
        role: payload.role || 'customer'
      }
    } catch {
      return null
    }
  } catch (error) {
    console.error('Error parsing session cookie in middleware:', error)
    return null
  }
}