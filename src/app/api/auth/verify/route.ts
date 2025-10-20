import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionCookie()
    
    if (!sessionUser) {
      return NextResponse.json(
        { 
          authenticated: false, 
          error: 'No valid session found' 
        },
        { status: 401 }
      )
    }

    // Return user info without sensitive data
    return NextResponse.json({
      authenticated: true,
      user: {
        uid: sessionUser.uid,
        email: sessionUser.email,
        emailVerified: sessionUser.emailVerified,
        role: sessionUser.role,
        lastLoginAt: sessionUser.lastLoginAt,
        sessionCreatedAt: sessionUser.sessionCreatedAt
      }
    })

  } catch (error) {
    console.error('Session verification error:', error)
    
    return NextResponse.json(
      { 
        authenticated: false, 
        error: 'Session verification failed' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { checkEmailVerification = false, requiredRole } = await request.json()
    
    const sessionUser = await getSessionCookie()
    
    if (!sessionUser) {
      return NextResponse.json(
        { 
          valid: false, 
          reason: 'authentication_required',
          message: 'Authentication required' 
        },
        { status: 401 }
      )
    }

    // Check email verification if required
    if (checkEmailVerification && !sessionUser.emailVerified) {
      return NextResponse.json(
        { 
          valid: false, 
          reason: 'email_verification_required',
          message: 'Email verification required' 
        },
        { status: 403 }
      )
    }

    // Check role if required
    if (requiredRole && sessionUser.role !== requiredRole) {
      return NextResponse.json(
        { 
          valid: false, 
          reason: 'insufficient_permissions',
          message: 'Insufficient permissions' 
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      valid: true,
      user: {
        uid: sessionUser.uid,
        email: sessionUser.email,
        emailVerified: sessionUser.emailVerified,
        role: sessionUser.role,
        lastLoginAt: sessionUser.lastLoginAt,
        sessionCreatedAt: sessionUser.sessionCreatedAt
      }
    })

  } catch (error) {
    console.error('Session validation error:', error)
    
    return NextResponse.json(
      { 
        valid: false, 
        reason: 'validation_error',
        message: 'Session validation failed' 
      },
      { status: 500 }
    )
  }
}