import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { code, from } = await request.json()

    // Get admin code from environment variable, default to 'broski-dev'
    const adminCode = process.env.BK_ADMIN_CODE || 'broski-dev'

    // Check if the provided code matches
    if (code !== adminCode) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      )
    }

    // Create response with redirect target
    const response = NextResponse.json({
      success: true,
      redirect: from || '/admin'
    })

    // Set session cookie for 12 hours
    const cookieStore = await cookies()
    cookieStore.set('bk_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60, // 12 hours in seconds
      path: '/'
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}