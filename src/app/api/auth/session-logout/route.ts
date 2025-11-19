export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'
import { clearSessionCookies } from '@/lib/auth/sessionCookieHelpers'

export async function POST(_request: NextRequest) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({});
  }
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')?.value || cookieStore.get('session')?.value

    if (sessionCookie) {
      try {
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
        console.warn('Error revoking session:', error)
      }
    }

    const response = NextResponse.json({ success: true }, {
      status: 200
    })
    
    clearSessionCookies(response.cookies)
    
    return response
  } catch (error) {
    console.error('Session logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
