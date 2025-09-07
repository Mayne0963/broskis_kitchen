import { cookies } from 'next/headers'

export interface SessionUser {
  uid: string
  email: string
  emailVerified: boolean
  name?: string
  role: string
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

    // Use API route for session verification
    console.log('Verifying session cookie via API...');
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionCookie }),
    });

    if (!response.ok) {
      console.error('Session verification failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('Session verification unsuccessful:', data.error);
      return null;
    }

    console.log('Verification successful:', !!data.user);
    console.log('Custom claims role:', data.user.role);

    return data.user;
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