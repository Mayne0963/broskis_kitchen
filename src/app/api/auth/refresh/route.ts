import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

// OPTIONS handler to avoid CORS preflight delays
export async function OPTIONS() {
  return new Response(null, { 
    status: 204, 
    headers: { "Cache-Control": "no-store" } 
  });
}

// POST - Refresh session cookie
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('bk_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { ok: false },
        { 
          status: 401,
          headers: { "Cache-Control": "no-store" }
        }
      );
    }

    const auth = adminAuth();
    if (!auth) {
      return NextResponse.json(
        { ok: false },
        { 
          status: 401,
          headers: { "Cache-Control": "no-store" }
        }
      );
    }

    // Verify the existing session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Create a new session cookie with extended expiration
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days
    const newSessionCookie = await auth.createSessionCookie(sessionCookie, { expiresIn });

    // Set the new session cookie
    const response = NextResponse.json(
      { ok: true },
      { 
        status: 200,
        headers: { "Cache-Control": "no-store" }
      }
    );
    
    response.cookies.set('bk_session', newSessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days (604800 seconds)
    });
    
    return response;
  } catch (error) {
    console.error('Error refreshing session cookie:', error);
    return NextResponse.json(
      { ok: false },
      { 
        status: 401,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}