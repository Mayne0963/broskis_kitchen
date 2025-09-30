export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'
import { verifyAdminAccess } from '@/lib/auth/rbac'
import { adminAuth, ensureAdmin } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  try {
    await ensureAdmin(request);
    console.log('=== AUTH DEBUG START ===')
    
    // Check if Firebase Admin is properly initialized
    const auth = adminAuth
    console.log('Firebase Admin Auth initialized:', !!auth)
    
    // Check session user
    const sessionUser = await getServerUser()
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
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify({
      firebaseAdminInitialized: !!auth,
      sessionUser,
      adminVerification,
      sessionCookieExists: !!sessionCookie,
      sessionCookieLength: sessionCookie?.value?.length || 0,
      timestamp: new Date().toISOString()
    }), { status: 200, headers })
  } catch (error) {
    console.error('Auth debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'INTERNAL'
    }, { status: 500 })
  }
}