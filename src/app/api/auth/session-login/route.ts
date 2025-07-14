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
    if (error instanceof Error) {
      if (error.message.includes('Firebase Admin not initialized')) {
        errorMessage = 'Firebase Admin SDK not properly configured'
      } else if (error.message.includes('Invalid ID token')) {
        errorMessage = 'Invalid authentication token'
      } else if (error.message.includes('Token expired')) {
        errorMessage = 'Authentication token expired'
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}