export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * Refresh session cookie with latest claims
 * 
 * This endpoint is called when:
 * 1. User's custom claims change (e.g., promoted to admin)
 * 2. Session cookie has stale claims
 * 3. User needs fresh authentication state
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({});
  }

  try {
    const body = await request.json();
    const { idToken } = body;
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token and force refresh to get latest claims
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    
    console.log('[REFRESH_SESSION] Refreshing session for user:', decodedToken.uid);
    console.log('[REFRESH_SESSION] Claims:', {
      admin: (decodedToken as any).admin,
      role: (decodedToken as any).role,
    });
    
    // Create new session cookie with fresh claims
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    // Update the session cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Session refreshed successfully',
      claims: {
        admin: (decodedToken as any).admin,
        role: (decodedToken as any).role,
      }
    });
    
    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    console.log('[REFRESH_SESSION] Session cookie updated');
    
    return response;
  } catch (error: any) {
    console.error('[REFRESH_SESSION] Error:', error);
    
    let errorMessage = 'Failed to refresh session';
    let statusCode = 500;
    
    if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid authentication token';
      statusCode = 401;
    } else if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Authentication token expired';
      statusCode = 401;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
