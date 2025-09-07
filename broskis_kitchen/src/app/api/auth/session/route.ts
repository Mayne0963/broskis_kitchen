import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - Verify session cookie
export async function POST(request: NextRequest) {
  try {
    const { sessionCookie } = await request.json();

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Session cookie required' },
        { status: 400 }
      );
    }

    const auth = adminAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    const user = {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      emailVerified: decodedClaims.email_verified || false,
      name: decodedClaims.name || decodedClaims.email?.split('@')[0],
      role: decodedClaims.role || 'customer',
      permissions: decodedClaims.permissions || []
    };

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid session cookie' },
      { status: 401 }
    );
  }
}

// GET - Get current session from cookies
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'No session cookie found' },
        { status: 401 }
      );
    }

    const auth = adminAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    const user = {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
      emailVerified: decodedClaims.email_verified || false,
      name: decodedClaims.name || decodedClaims.email?.split('@')[0],
      role: decodedClaims.role || 'customer',
      permissions: decodedClaims.permissions || []
    };

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid session cookie' },
      { status: 401 }
    );
  }
}