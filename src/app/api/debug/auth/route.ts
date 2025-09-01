import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/auth/session'
import { verifyAdminAccess } from '@/lib/auth/rbac'
import { adminAuth } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH DEBUG START ===')
    
    // Check if Firebase Admin is properly initialized
    const auth = adminAuth()
    console.log('Firebase Admin Auth initialized:', !!auth)
    
    // Check session cookie
    const sessionUser = await getSessionCookie()
    console.log('Session user:', sessionUser)
    
    // Check admin access
    const adminVerification = await verifyAdminAccess()
    console.log('Admin verification:', adminVerification)
    
    // Check cookies from request
    const cookies = request.cookies
    const sessionCookie = cookies.get('session')
    console.log('Session cookie exists:', !!sessionCookie)
    console.log('Session cookie value length:', sessionCookie?.value?.length || 0)
    
    console.log('=== AUTH DEBUG END ===')
    
    return NextResponse.json({
      firebaseAdminInitialized: !!auth,
      sessionUser,
      adminVerification,
      sessionCookieExists: !!sessionCookie,
      sessionCookieLength: sessionCookie?.value?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auth debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}