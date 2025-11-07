import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/session';
import { securityMiddleware, setCSRFToken } from '@/lib/auth/security';

export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const securityCheck = securityMiddleware(request);
    if (!securityCheck.allowed) {
      return securityCheck.response!;
    }

    // Check session
    const sessionUser = await getSessionCookie();
    
    const response = NextResponse.json({
      authenticated: !!sessionUser,
      user: sessionUser ? {
        uid: sessionUser.uid,
        email: sessionUser.email,
        emailVerified: sessionUser.emailVerified,
        role: sessionUser.role
      } : null,
      sessionExpiry: sessionUser?.sessionExpiry || null,
      error: sessionUser ? null : 'NO_SESSION'
    });

    // Set CSRF token for authenticated users
    if (sessionUser) {
      setCSRFToken(response);
    }

    return response;

  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json(
      { 
        authenticated: false, 
        user: null, 
        error: 'Internal server error' 
      },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}