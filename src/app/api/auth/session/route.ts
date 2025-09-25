import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'

export async function GET() {
  try {
    const user = await getServerUser()
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    return new NextResponse(JSON.stringify({
      authenticated: !!user,
      user: user || null
    }), { status: 200, headers })
    
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 })
  }
}

export const dynamic = 'force-dynamic'