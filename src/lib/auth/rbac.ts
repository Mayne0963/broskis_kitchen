import { NextRequest } from 'next/server'

// Define user roles
export type UserRole = 'customer' | 'admin' | 'kitchen'

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  customer: [
    'view_own_orders',
    'create_orders',
    'view_menu',
    'view_rewards',
    'redeem_rewards'
  ],
  kitchen: [
    'view_orders',
    'update_order_status',
    'view_kitchen_display',
    'manage_preparation_queue'
  ],
  admin: [
    'view_all_orders',
    'update_order_status',
    'view_analytics',
    'manage_menu',
    'manage_users',
    'view_admin_dashboard',
    'manage_rewards',
    'view_kitchen_display',
    'manage_preparation_queue',
    'view_own_orders',
    'create_orders',
    'view_menu',
    'view_rewards',
    'redeem_rewards'
  ]
} as const

// Define route access by role
export const ROLE_ROUTES = {
  customer: [
    '/dashboard',
    '/orders',
    '/account',
    '/profile',
    '/rewards',
    '/loyalty',
    '/cart',
    '/checkout'
  ],
  kitchen: [
    '/kitchen',
    '/kitchen/display',
    '/kitchen/orders'
  ],
  admin: [
    '/admin',
    '/admin/dsahboard',
    '/admin/orders',
    '/admin/analytics',
    '/admin/users',
    '/admin/menu',
    '/kitchen',
    '/kitchen/display',
    '/kitchen/orders',
    '/dashboard',
    '/orders',
    '/account',
    '/profile',
    '/rewards',
    '/loyalty',
    '/cart',
    '/checkout'
  ]
} as const

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole | undefined, permission: string): boolean {
  if (!userRole) return false
  return ROLE_PERMISSIONS[userRole]?.includes(permission as any) || false
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(userRole: UserRole | undefined, route: string): boolean {
  if (!userRole) return false
  
  // Check if the route starts with any allowed route for the user's role
  return ROLE_ROUTES[userRole]?.some(allowedRoute => 
    route.startsWith(allowedRoute)
  ) || false
}

/**
 * Get the default redirect path for a user role
 */
export function getDefaultRedirectPath(userRole: UserRole | undefined): string {
  switch (userRole) {
    case 'admin':
      return '/admin'
    case 'kitchen':
      return '/kitchen'
    case 'customer':
    default:
      return '/dashboard'
  }
}

/**
 * Verify user role from session (for API routes)
 */
export async function verifyRole(requiredRole: UserRole | UserRole[]): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Dynamic import to avoid Edge Runtime issues
    const { getSessionCookie } = await import('./session')
    const user = await getSessionCookie()
    
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    if (!user.emailVerified) {
      return { success: false, error: 'Email verification required' }
    }

    const userRole = user.role as UserRole || 'customer'
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    
    if (!allowedRoles.includes(userRole)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    return { success: true, user: { ...user, role: userRole } }
  } catch (error) {
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * Verify admin access
 */
export async function verifyAdminAccess(): Promise<{ success: boolean; user?: any; error?: string }> {
  return verifyRole('admin')
}

/**
 * Verify kitchen staff access
 */
export async function verifyKitchenAccess(): Promise<{ success: boolean; user?: any; error?: string }> {
  return verifyRole(['admin', 'kitchen'])
}

/**
 * Verify customer access (authenticated users)
 */
export async function verifyCustomerAccess(): Promise<{ success: boolean; user?: any; error?: string }> {
  return verifyRole(['customer', 'admin', 'kitchen'])
}

/**
 * Create a role-based middleware wrapper
 */
export function withRoleAuth(requiredRole: UserRole | UserRole[]) {
  return async (handler: (user: any) => Promise<Response> | Response) => {
    const verification = await verifyRole(requiredRole)
    
    if (!verification.success) {
      return new Response(
        JSON.stringify({ error: verification.error }),
        { status: verification.error === 'Authentication required' ? 401 : 403 }
      )
    }

    return handler(verification.user)
  }
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return userRole === 'admin'
}

/**
 * Check if user has kitchen privileges
 */
export function isKitchenStaff(userRole: UserRole | undefined): boolean {
  return userRole === 'kitchen' || userRole === 'admin'
}

/**
 * Check if user is a customer
 */
export function isCustomer(userRole: UserRole | undefined): boolean {
  return userRole === 'customer' || userRole === 'admin'
}