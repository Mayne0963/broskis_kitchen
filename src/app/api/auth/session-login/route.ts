import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      )
    }

    // Verify the ID token
    const auth = adminAuth()
    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      )
    }
    
    const decodedToken = await auth.verifyIdToken(idToken)

    // Check if email is verified (skip for Google OAuth users as they are pre-verified)
    const isGoogleUser = decodedToken.firebase?.sign_in_provider === 'google.com'
    // Google OAuth users are already verified by Google, so we only check email verification for other providers
    if (!decodedToken.email_verified && !isGoogleUser) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 403 }
      )
    }

    // Create session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })

    // Set the session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Session login error:', error)
    
    // Provide more specific error messages for debugging
    let errorMessage = 'Failed to create session'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('Firebase Admin not initialized')) {
        errorMessage = 'Firebase Admin SDK not properly configured'
        console.error('Firebase Admin SDK environment variables may be missing. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local')
      } else if (error.message.includes('Invalid ID token')) {
        errorMessage = 'Invalid authentication token'
        statusCode = 401
      } else if (error.message.includes('Token expired')) {
        errorMessage = 'Authentication token expired'
        statusCode = 401
      } else {
        console.error('Detailed error:', error.message)
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}