import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/session';
import { securityMiddleware, logSecurityEvent } from '@/lib/auth/security';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const securityCheck = securityMiddleware(request);
    if (!securityCheck.allowed) {
      return securityCheck.response!;
    }

    // Verify current session
    const sessionResult = await getSessionCookie(request);
    if (!sessionResult.success || !sessionResult.user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const user = sessionResult.user;

    try {
      // Get fresh ID token from Firebase
      const userRecord = await adminAuth.getUser(user.uid);
      
      // Create new session cookie with extended expiration
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const sessionCookie = await adminAuth.createSessionCookie(
        await adminAuth.createCustomToken(user.uid),
        { expiresIn }
      );

      // Create response with new session cookie
      const response = NextResponse.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL
        },
        expiresAt: new Date(Date.now() + expiresIn).toISOString()
      });

      // Set new session cookie
      response.cookies.set('session', sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });

      // Log successful refresh
      logSecurityEvent({
        type: 'session_refresh',
        userId: user.uid,
        ip: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined
      });

      return response;

    } catch (firebaseError: any) {
      console.error('Firebase session refresh error:', firebaseError);
      
      // Clear invalid session
      const response = NextResponse.json(
        { error: 'Session refresh failed' },
        { status: 401 }
      );
      
      response.cookies.delete('session');
      
      return response;
    }

  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? 'https://broskiskitchen.com' 
        : 'https://broskiskitchen.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-csrf-token',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}