import { cookies } from 'next/headers'

export interface SessionUser {
  uid: string
  email: string
  emailVerified: boolean
  name?: string
  role: string
  permissions?: string[]
}

// Full session verification for server-side (Node.js Runtime)
export async function getSessionCookie(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    console.log('Session cookie value:', sessionCookie ? 'exists' : 'missing');

    if (!sessionCookie) {
      return null
    }

    // Direct Firebase Admin verification (no HTTP calls)
    console.log('Verifying session cookie directly...');
    const { adminAuth } = await import('@/lib/firebaseAdmin');
    
    if (!adminAuth) {
      console.error('Firebase Admin not initialized');
      return null;
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    const user: SessionUser = {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      emailVerified: decodedClaims.email_verified || false,
      name: decodedClaims.name || decodedClaims.email?.split('@')[0],
      role: decodedClaims.role || 'customer',
      permissions: decodedClaims.permissions || []
    };

    console.log('Verification successful:', !!user);
    console.log('Custom claims role:', user.role);

    return user;
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