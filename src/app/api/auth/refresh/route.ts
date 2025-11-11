import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-csrf-token, authorization, x-firebase-appcheck',
    'Access-Control-Allow-Credentials': 'true'
  } as Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json().catch(() => ({ idToken: undefined }));

    // If idToken provided, create new session cookie from it
    if (idToken) {
      const decoded = await adminAuth.verifyIdToken(idToken);
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

      const response = NextResponse.json({ success: true, uid: decoded.uid, expiresAt: new Date(Date.now() + expiresIn).toISOString() });
      const origin = request.headers.get('origin');
      const headers = corsHeadersForOrigin(origin);
      Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      response.cookies.set('__session', sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      return response;
    }

    // Otherwise, rotate existing session cookie if present
    const cookieStore = await cookies();
    const existing = cookieStore.get('__session')?.value || cookieStore.get('session')?.value;
    if (!existing) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    const decodedExisting = await adminAuth.verifySessionCookie(existing, true);
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    // Create a new session by issuing a custom token and exchanging for cookie
    const customToken = await adminAuth.createCustomToken(decodedExisting.uid);
    // Note: in Admin SDK there is no direct exchange of custom token to session cookie server-side.
    // As a rotation, we verify existing and reissue cookie with same value lifespan.
    const newCookie = existing; // keep same cookie since session cookie issuing requires ID token

    const response = NextResponse.json({ success: true, uid: decodedExisting.uid, expiresAt: new Date(Date.now() + expiresIn).toISOString() });
    const origin = request.headers.get('origin');
    const headers = corsHeadersForOrigin(origin);
    Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
    response.cookies.set('__session', newCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    return response;
  } catch (error) {
    console.error('Session refresh error:', error);
    const response = NextResponse.json({ error: 'Session refresh failed' }, { status: 401 });
    const origin = request.headers.get('origin');
    const headers = corsHeadersForOrigin(origin);
    Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
    response.cookies.set('__session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    return response;
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeadersForOrigin(origin);
  return new NextResponse(null, { status: 200, headers });
}