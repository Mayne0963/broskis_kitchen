import { NextResponse } from "next/server";
import { verifyIdToken, isUserAdmin } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

/**
 * Extract ID token from request headers or cookies
 */
function extractToken(req: Request): string | null {
  // Try Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  // Try cookie as fallback
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("firebase-token");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Middleware to require admin authentication
 * Throws 401 if no token, 403 if not admin
 */
export async function requireAdmin(req: Request) {
  const token = extractToken(req);
  
  if (!token) {
    throw NextResponse.json(
      { error: "Unauthorized - No token provided" }, 
      { status: 401 }
    );
  }

  try {
    const decoded = await verifyIdToken(token);
    
    // Check if user has admin claims
    const hasAdminClaim = decoded.admin === true || decoded.role === 'admin';
    
    // Double-check with user record if no claims found
    if (!hasAdminClaim) {
      const isAdmin = await isUserAdmin(decoded.uid);
      if (!isAdmin) {
        throw NextResponse.json(
          { error: "Forbidden - Admin access required" }, 
          { status: 403 }
        );
      }
    }

    return decoded;
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw NextResponse errors
    }
    
    console.error('Token verification failed:', error);
    throw NextResponse.json(
      { error: "Unauthorized - Invalid token" }, 
      { status: 401 }
    );
  }
}

/**
 * Wrapper for API routes that require admin access
 */
export function withAdminAuth(handler: (req: Request, context: any, user: any) => Promise<Response>) {
  return async (req: Request, context: any) => {
    try {
      const user = await requireAdmin(req);
      return await handler(req, context, user);
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }
      
      console.error('Admin auth wrapper error:', error);
      return NextResponse.json(
        { error: "Internal server error" }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Check if request has valid admin token (non-throwing version)
 */
export async function checkAdminAuth(req: Request): Promise<{ isAdmin: boolean; user?: any; error?: string }> {
  try {
    const user = await requireAdmin(req);
    return { isAdmin: true, user };
  } catch (error) {
    if (error instanceof Response) {
      const errorData = await error.json();
      return { isAdmin: false, error: errorData.error };
    }
    return { isAdmin: false, error: 'Authentication failed' };
  }
}