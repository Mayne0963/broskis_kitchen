import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/session';
import { securityMiddleware, setCSRFToken } from '@/lib/auth/security';

const ALLOWED_ORIGINS = new Set([
  'https://broskiskitchen.com',
  'https://www.broskiskitchen.com',
  'https://brooksdb.com',
  'https://www.brooksdb.com',
  'http://localhost:3000'
]);

function corsHeadersForOrigin(origin?: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://broskiskitchen.com';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-csrf-token, authorization',
    'Access-Control-Allow-Credentials': 'true'
  } as Record<string, string>;
}

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

    const origin = request.headers.get('origin');
    const headers = corsHeadersForOrigin(origin);
    Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));

    // Set CSRF token for authenticated users
    if (sessionUser) {
      setCSRFToken(response);
    }

    return response;

  } catch (error) {
    console.error('Auth status check error:', error);
    const res = NextResponse.json(
      { 
        authenticated: false, 
        user: null, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
    const origin = request.headers.get('origin');
    const headers = corsHeadersForOrigin(origin);
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeadersForOrigin(origin);
  return new NextResponse(null, { status: 200, headers });
}