import { UserRole } from './rbac'

/**
 * Set custom claims for a user (admin only)
 */
export async function setUserRole(uid: string, role: UserRole): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uid, role })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to set user role');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    return { success: false, error: 'Failed to set user role' };
  }
}

/**
 * Get user's custom claims
 */
export async function getUserRole(uid: string): Promise<{ success: boolean; role?: UserRole; error?: string }> {
  try {
    const response = await fetch(`/api/auth/roles?uid=${encodeURIComponent(uid)}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get user role');
    }
    
    return { success: true, role: data.role };
  } catch (error) {
    console.error('Error getting user role:', error);
    return { success: false, error: 'Failed to get user role' };
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
  try {
    const response = await fetch('/api/auth/roles', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assignments })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: data.success,
      results: data.results
    };
  } catch (error) {
    console.error('Error in bulk role assignment:', error);
    return {
      success: false,
      results: assignments.map(({ uid }) => ({
        uid,
        success: false,
        error: 'Failed to process bulk role assignment'
      }))
    };
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
    const response = await fetch(`/api/auth/roles?action=list&maxResults=${maxResults}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get users');
    }
    
    return { success: true, users: data.users };
  } catch (error) {
    console.error('Error getting users with roles:', error);
    return { success: false, error: 'Failed to get users' };
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