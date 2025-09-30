export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, ensureAdmin } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({});
  }
  
  let idToken;
  try {
    await ensureAdmin(request);
    const body = await request.json();
    idToken = body.idToken;
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  if (!idToken) {
    return NextResponse.json(
      { error: 'ID token is required' },
      { status: 400 }
    );
  }

  // Verify the ID token
  const auth = adminAuth;
  try {
    const decodedToken = await auth.verifyIdToken(idToken);

    // Check if email is verified (skip for Google OAuth users as they are pre-verified)
    const isGoogleUser = decodedToken.firebase?.sign_in_provider === 'google.com';
    if (!decodedToken.email_verified && !isGoogleUser) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 403 }
      );
    }

    // Create session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Set the session cookie
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return response;
  } catch (error: unknown) {
    console.error('Session login error:', error);
    
    // Provide more specific error messages for debugging
    let errorMessage = 'Failed to create session';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Firebase Admin not initialized') || (error as any).code === 'auth/app-not-initialized') {
        errorMessage = 'Firebase Admin SDK not properly configured. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local';
        console.error(errorMessage);
      } else if (error.message.includes('Invalid ID token') || (error as any).code === 'auth/invalid-id-token') {
        errorMessage = 'Invalid authentication token';
        statusCode = 401;
      } else if (error.message.includes('Token expired') || (error as any).code === 'auth/id-token-expired') {
        errorMessage = 'Authentication token expired';
        statusCode = 401;
      } else if ('code' in error && typeof error.code === 'string' && error.code.startsWith('auth/')) {
        errorMessage = error.message;
        statusCode = 401;
      } else {
        console.error('Detailed error:', error.message);
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}