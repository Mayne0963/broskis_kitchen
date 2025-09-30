export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Server-only authentication gate for admin access
 * Uses NextAuth sessions with zero extra fetches
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

/**
 * Require admin access using NextAuth session (zero extra fetches)
 * @param request - Next.js request object
 * @returns User data if admin, throws error if not
 */
export async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  
  const userRole = (session.user as any).role;
  if (userRole !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return {
    uid: (session.user as any).uid,
    email: session.user.email,
    role: userRole,
    name: session.user.name,
  };
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