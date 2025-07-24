import { cookies } from 'next/headers'

export interface SessionUser {
  uid: string
  email: string
  emailVerified: boolean
  name?: string
  role: string
}

// Lightweight session check for middleware (Edge Runtime)
// Since Firebase Admin SDK doesn't work in Edge Runtime, we'll use a simpler approach
export async function getSessionCookieForMiddleware(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    console.log('Middleware: Session cookie:', sessionCookie ? 'exists' : 'missing');

    if (!sessionCookie) {
      return null
    }

    // For middleware in Edge Runtime, we'll just check if session cookie exists
    // The actual verification happens in the dashboard page server component
    // This is a security trade-off for Edge Runtime compatibility
    
    // Return a basic user object to allow middleware to pass
    // Real verification happens server-side in the dashboard
    return {
      uid: 'middleware-check',
      email: 'user@example.com',
      emailVerified: true,
      name: 'User',
      role: 'customer'
    }
  } catch (error) {
    console.error('Error checking session cookie in middleware:', error)
    return null
  }
}