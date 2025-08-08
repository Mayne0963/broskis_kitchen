import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebaseAdmin'
import type { DecodedIdToken } from 'firebase-admin/auth'

export interface SessionUser {
  uid: string
  email: string
  emailVerified: boolean
  name?: string
  role?: string
  admin?: boolean
  permissions?: string[]
}

// Full session verification for API routes (Node.js Runtime)
export async function getSessionCookie(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    console.log('Session cookie value:', sessionCookie ? 'exists' : 'missing');

    if (!sessionCookie) {
      return null
    }

    // Use firebase-admin for full verification in Node.js runtime
    const auth = adminAuth()
    console.log('Admin auth initialized:', !!auth);
    if (!auth) {
      console.error('Firebase Admin not initialized')
      return null
    }
    
    console.log('Verifying session cookie...');
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    console.log('Verification successful:', !!decodedClaims);
    console.log('Custom claims:', decodedClaims.admin, decodedClaims.role);

    // Extract role from custom claims or direct claims
    const role = decodedClaims.role || (decodedClaims.admin ? 'admin' : 'customer');
    const isAdmin = decodedClaims.admin === true;
    const permissions = decodedClaims.permissions || [];

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      emailVerified: decodedClaims.email_verified || false,
      name: decodedClaims.name || decodedClaims.email?.split('@')[0],
      role: role,
      admin: isAdmin,
      permissions: permissions
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