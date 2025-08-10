import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, type UserRole } from '@/lib/auth/rbac'
import { setUserRole, getUserRole, canAssignRole } from '@/lib/auth/roleManager'

// PUT /api/admin/users/[uid]/role - Update user role
export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    // Verify admin access
    const verification = await verifyAdminAccess()
    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.error === 'Authentication required' ? 401 : 403 }
      )
    }

    const { uid } = params
    const { role } = await request.json()

    // Validate input
    if (!uid || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: UserRole[] = ['customer', 'kitchen', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Check if admin can assign this role
    const adminRole = verification.user.role as UserRole
    if (!canAssignRole(adminRole, role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign this role' },
        { status: 403 }
      )
    }

    // Set the user role
    const result = await setUserRole(uid, role)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      uid,
      role
    })
  } catch (error) {
    console.error('Error in PUT /api/admin/users/[uid]/role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/users/[uid]/role - Get user role
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    // Verify admin access
    const verification = await verifyAdminAccess()
    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error },
        { status: verification.error === 'Authentication required' ? 401 : 403 }
      )
    }

    const { uid } = params

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get the user role
    const result = await getUserRole(uid)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      uid,
      role: result.role
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users/[uid]/role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}