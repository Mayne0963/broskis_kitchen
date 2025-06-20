import { cookies } from 'next/headers'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  
  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
    console.error('Missing Firebase Admin SDK configuration')
  } else {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    })
  }
}

export interface SessionUser {
  uid: string
  email: string
  emailVerified: boolean
  name?: string
  role?: string
}

export async function getSessionCookie(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) {
      return null
    }

    const auth = getAuth()
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      emailVerified: decodedClaims.email_verified || false,
      name: decodedClaims.name || decodedClaims.email?.split('@')[0],
      role: decodedClaims.role || 'customer'
    }
  } catch (error) {
    console.error('Session verification error:', error)
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