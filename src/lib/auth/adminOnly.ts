/**
 * Server-only authentication gate for admin access
 * Validates Firebase ID tokens and ensures admin privileges
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

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
function extractIdToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // Try session cookie
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');
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
 * @returns Promise<DecodedIdToken> - Decoded token with admin claims
 * @throws NextResponse with 401/403 status if unauthorized
 */
export async function requireAdmin(request: NextRequest) {
  try {
    const idToken = extractIdToken(request);
    
    if (!idToken) {
      throw NextResponse.json(
        { error: 'Unauthorized - No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify the ID token
    const decodedToken = await verifyIdToken(idToken);
    
    // Check for admin claim
    const isAdmin = decodedToken.admin === true || 
                   decodedToken.role === 'admin' ||
                   (decodedToken.roles && decodedToken.roles.admin === true);
    
    if (!isAdmin) {
      throw NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    return decodedToken;
  } catch (error) {
    // If error is already a NextResponse, throw it
    if (error instanceof NextResponse) {
      throw error;
    }
    
    // Handle token verification errors
    console.error('Admin authentication failed:', error);
    throw NextResponse.json(
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
      await requireAdmin(request);
      return handler(request, ...args);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
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
    await requireAdmin(request);
    return true;
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