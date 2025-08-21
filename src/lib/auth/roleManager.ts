import { adminAuth } from '@/lib/firebaseAdmin'
import { UserRole } from './rbac'

/**
 * Set custom claims for a user (admin only)
 */
export async function setUserRole(uid: string, role: UserRole): Promise<{ success: boolean; error?: string }> {
  try {
    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role })
    
    return { success: true }
  } catch (error) {
    console.error('Error setting user role:', error)
    return { success: false, error: 'Failed to set user role' }
  }
}

/**
 * Get user's custom claims
 */
export async function getUserRole(uid: string): Promise<{ success: boolean; role?: UserRole; error?: string }> {
  try {
    const userRecord = await adminAuth.getUser(uid)
    const role = userRecord.customClaims?.role as UserRole || 'customer'
    
    return { success: true, role }
  } catch (error) {
    console.error('Error getting user role:', error)
    return { success: false, error: 'Failed to get user role' }
  }
}

/**
 * Remove role from user (set to customer)
 */
export async function removeUserRole(uid: string): Promise<{ success: boolean; error?: string }> {
  return setUserRole(uid, 'customer')
}

/**
 * Bulk role assignment
 */
export async function bulkSetUserRoles(assignments: { uid: string; role: UserRole }[]): Promise<{
  success: boolean;
  results: { uid: string; success: boolean; error?: string }[];
}> {
  const results = await Promise.all(
    assignments.map(async ({ uid, role }) => {
      const result = await setUserRole(uid, role)
      return { uid, ...result }
    })
  )

  const allSuccessful = results.every(result => result.success)
  
  return {
    success: allSuccessful,
    results
  }
}

/**
 * Get all users with their roles (admin only)
 */
export async function getAllUsersWithRoles(maxResults: number = 1000): Promise<{
  success: boolean;
  users?: Array<{ uid: string; email: string; role: UserRole; emailVerified: boolean }>;
  error?: string;
}> {
  try {
    const listUsersResult = await adminAuth.listUsers(maxResults)
    
    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email || '',
      role: (userRecord.customClaims?.role as UserRole) || 'customer',
      emailVerified: userRecord.emailVerified
    }))
    
    return { success: true, users }
  } catch (error) {
    console.error('Error getting users with roles:', error)
    return { success: false, error: 'Failed to get users' }
  }
}

/**
 * Validate role assignment permissions
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  // Only admins can assign roles
  if (assignerRole !== 'admin') {
    return false
  }
  
  // Admins can assign any role
  return true
}

/**
 * Get role hierarchy level (for permission checks)
 */
export function getRoleLevel(role: UserRole): number {
  switch (role) {
    case 'customer':
      return 1
    case 'kitchen':
      return 2
    case 'admin':
      return 3
    default:
      return 0
  }
}

/**
 * Check if one role has higher privileges than another
 */
export function hasHigherPrivileges(role1: UserRole, role2: UserRole): boolean {
  return getRoleLevel(role1) > getRoleLevel(role2)
}