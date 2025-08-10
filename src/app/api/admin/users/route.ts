import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/auth/rbac'
import { getAllUsersWithRoles } from '@/lib/auth/roleManager'

// GET /api/admin/users - Get all users with their roles
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const verification = await verifyAdminAccess()
    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.error === 'Authentication required' ? 401 : 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get('limit') || '100')

    // Get all users with roles
    const result = await getAllUsersWithRoles(maxResults)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: result.users
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}