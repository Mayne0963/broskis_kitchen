import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebaseAdmin'

export interface SessionUser {
  uid: string
  email: string
  emailVerified: boolean
  name?: string
  role?: string
}

// Full session verification for API routes (Node.js Runtime)
export async function getSessionCookie(): Promise<DecodedIdToken | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) {
      return null
    }

    // Use firebase-admin for full verification in Node.js runtime
    const auth = adminAuth()
    if (!auth) {
      console.error('Firebase Admin not initialized')
      return null
    }
    
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      emailVerified: decodedClaims.email_verified || false,
      name: decodedClaims.name || decodedClaims.email?.split('@')[0],
      role: decodedClaims.role || 'customer'
    }
  } catch (error) {
    console.error('Error verifying session cookie:', error)
    return null
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionCookie()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireEmailVerification(): Promise<SessionUser> {
  const user = await requireAuth()
  if (!user.emailVerified) {
    throw new Error('Email verification required')
  }
  return user
}