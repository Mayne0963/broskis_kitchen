import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Clear the session cookie
    const cookieStore = cookies()
    cookieStore.delete('bk_session')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Also support GET requests for logout
  return POST()
}