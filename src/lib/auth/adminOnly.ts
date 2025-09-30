export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Server-only authentication gate for admin access
 * Validates Firebase ID tokens and ensures admin privileges
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, ensureAdmin } from '@/lib/firebase/admin';

// Inline verifyIdToken function to avoid duplicate admin config
async function verifyIdToken(idToken: string, checkRevoked: boolean = true) {
  try {
    return await adminAuth.verifyIdToken(idToken, checkRevoked);
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}
import { cookies } from 'next/headers';

/**
 * Extracts ID token from request headers or cookies
 * @param request - Next.js request object
 * @returns ID token string or null
 */
async function extractIdToken(request: NextRequest): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // Try session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session');
  if (sessionCookie) {
    return sessionCookie.value;
  }

  // Try __session cookie (Firebase hosting)
  const firebaseSession = cookieStore.get('__session');
  if (firebaseSession) {
    return firebaseSession.value;
  }

  return null;
}

/**
 * Requires admin authentication for API routes
 * @param request - Next.js request object
 * @returns Promise<DecodedIdToken | NextResponse> - Decoded token with admin claims or error response
 */
export async function requireAdmin(request: NextRequest) {
  try {
    return await ensureAdmin(request);
  } catch (error) {
    // If error is already a NextResponse, throw it
    if (error instanceof NextResponse) {
      throw error;
    }
    
    // Handle token verification errors
    console.error('Admin authentication failed:', error);
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or expired token' },
      { status: 401 }
    );
  }
}

/**
 * Middleware wrapper for admin-only API routes
 * @param handler - The API route handler function
 * @returns Wrapped handler with admin authentication
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const adminCheck = await requireAdmin(request);
      if (adminCheck instanceof NextResponse) {
        return adminCheck;
      }
      return handler(request, ...args);
    } catch (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Checks if a user has admin privileges without throwing
 * @param request - Next.js request object
 * @returns Promise<boolean> - True if user is admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const result = await requireAdmin(request);
    return !(result instanceof NextResponse);
  } catch {
    return false;
  }
}

/**
 * Alias for requireAdmin for backward compatibility
 * @param request - Next.js request object
 * @returns Promise<DecodedIdToken> - Decoded token with admin claims
 */
export const verifyAdminAuth = requireAdmin;