export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Server-only authentication gate for admin access
 * Uses Firebase session cookies with zero extra fetches
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * Require admin access using Firebase session cookie (zero extra fetches)
 * @param request - Next.js request object
 * @returns User data if admin, throws error if not
 */
export async function requireAdmin(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value || cookieStore.get("session")?.value;
  
  if (!sessionCookie) {
    throw new Error('Authentication required');
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Check if user is admin from custom claims or role
    const userRole = (decoded as any).role || 'user';
    const isAdmin = userRole === 'admin' || (decoded as any).admin === true;
    
    if (!isAdmin) {
      throw new Error('Admin access required');
    }
    
    return {
      uid: decoded.uid,
      email: decoded.email,
      role: userRole,
      name: (decoded as any).name || decoded.email?.split('@')[0],
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Admin access required')) {
      throw error;
    }
    throw new Error('Authentication required');
  }
}

/**
 * Higher-order function to wrap API handlers with admin authentication
 * Uses NextAuth session for zero-fetch admin verification
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      await requireAdmin(request);
      return handler(request, ...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Access denied';
      return NextResponse.json(
        { error: message },
        { status: message.includes('Authentication') ? 401 : 403 }
      );
    }
  };
}

/**
 * Check if current user is admin (zero extra fetches)
 * @param request - Next.js request object
 * @returns true if admin, false otherwise
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    await requireAdmin(request);
    return true;
  } catch {
    return false;
  }
}

// Alias for backward compatibility
export const verifyAdminAuth = requireAdmin;