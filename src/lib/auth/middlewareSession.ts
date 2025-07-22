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
export async function getSessionCookieForMiddleware(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    console.log('Middleware: Session cookie:', sessionCookie ? 'exists' : 'missing');

    if (!sessionCookie) {
      return null
    }

    // Basic JWT payload extraction (not cryptographically verified)
    // This is only for route protection in middleware
    try {
      console.log('Middleware: Attempting to parse JWT payload');
      const payloadBase64 = sessionCookie.split('.')[1];
      console.log('Middleware: Payload base64:', payloadBase64 ? 'exists' : 'missing');
      const payload = JSON.parse(atob(payloadBase64))
      console.log('Middleware: Payload parsed successfully:', !!payload);
      return {
        uid: payload.uid,
        email: payload.email || '',
        emailVerified: payload.email_verified || false,
        name: payload.name || payload.email?.split('@')[0],
        role: payload.role || 'customer'
      }
    } catch (error) {
      console.error('Middleware: Error parsing payload:', error);
      return null
    }
  } catch (error) {
    console.error('Error parsing session cookie in middleware:', error)
    return null
  }
}