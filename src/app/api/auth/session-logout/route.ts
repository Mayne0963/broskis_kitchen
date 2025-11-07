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
  try {
    await ensureAdmin(request);
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')?.value || cookieStore.get('session')?.value

    if (sessionCookie) {
      try {
        // Verify and revoke the session
    const auth = adminAuth
    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      )
    }
    
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    await auth.revokeRefreshTokens(decodedClaims.uid)
      } catch (error) {
        // Session might be invalid, but we still want to clear the cookie
        console.warn('Error revoking session:', error)
      }
    }

    // Clear the session cookie
    const response = NextResponse.json({ success: true }, {
      status: 200
    })
    
    response.cookies.set('__session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Session logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}