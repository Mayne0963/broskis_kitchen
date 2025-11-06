export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET() {
  const s = await getServerSession(authOptions as any);
  return new Response(JSON.stringify({ ok: !!s, user: s?.user ?? null, role: (s?.user as any)?.role ?? null }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store, private, max-age=0" },
  });
}

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

    // Verify the ID token using Firebase Admin
    const auth = adminAuth;
    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const decodedToken = await auth.verifyIdToken(idToken);

    // Check if email is verified (skip for Google OAuth users as they are pre-verified)
    const isGoogleUser = decodedToken.firebase?.sign_in_provider === 'google.com';
    const emailVerified = decodedToken.email_verified ?? decodedToken.emailVerified ?? false;
    if (!emailVerified && !isGoogleUser) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 403 }
      );
    }

    // Create session cookie (expires in 5 days)
    const expiresInMs = 60 * 60 * 24 * 5 * 1000; // 5 days in ms
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });

    // Set the session cookie
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set('__session', sessionCookie, {
      // maxAge expects seconds per Next.js cookies API
      maxAge: Math.floor(expiresInMs / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return response;
  } catch (error: unknown) {
    console.error('Session creation error:', error);
    
    let errorMessage = 'Failed to create session';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Firebase Admin not initialized') || (error as any).code === 'auth/app-not-initialized') {
        errorMessage = 'Firebase Admin SDK not properly configured';
        console.error(errorMessage);
      } else if (error.message.includes('Invalid ID token') || (error as any).code === 'auth/invalid-id-token') {
        errorMessage = 'Invalid authentication token';
        statusCode = 401;
      } else if (error.message.includes('Token expired') || (error as any).code === 'auth/id-token-expired') {
        errorMessage = 'Authentication token expired';
        statusCode = 401;
      } else if ('code' in error && typeof (error as any).code === 'string' && (error as any).code.startsWith('auth/')) {
        errorMessage = (error as any).message;
        statusCode = 401;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function DELETE() {
  try {
    // Clear the session cookie
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set('__session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}