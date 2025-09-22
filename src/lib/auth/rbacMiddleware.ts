// RBAC utilities for Edge Runtime (middleware)
// This file contains only the functions needed for middleware without Firebase Admin dependencies

// Define user roles
export type UserRole = 'customer' | 'admin' | 'kitchen'

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
    '/admin/dashboard',
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
 * Check if a user can access a specific route (for middleware)
 */
export function canAccessRoute(userRole: UserRole | undefined, route: string): boolean {
  if (!userRole) return false
  
  // Check if the route starts with any allowed route for the user's role
  return ROLE_ROUTES[userRole]?.some(allowedRoute => 
    route.startsWith(allowedRoute)
  ) || false
}

/**
 * Get the default redirect path for a user role (for middleware)
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