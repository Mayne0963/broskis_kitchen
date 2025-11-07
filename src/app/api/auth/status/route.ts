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
    const sessionResult = await getSessionCookie(request);
    
    const response = NextResponse.json({
      authenticated: sessionResult.success,
      user: sessionResult.success ? {
        uid: sessionResult.user!.uid,
        email: sessionResult.user!.email,
        emailVerified: sessionResult.user!.emailVerified,
        displayName: sessionResult.user!.displayName,
        photoURL: sessionResult.user!.photoURL,
        role: sessionResult.user!.role
      } : null,
      sessionExpiry: sessionResult.success ? sessionResult.user!.exp : null,
      error: sessionResult.success ? null : sessionResult.error
    });

    // Set CSRF token for authenticated users
    if (sessionResult.success) {
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