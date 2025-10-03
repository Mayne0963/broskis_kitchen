import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { cookies, headers } from "next/headers";
import { adminAuth } from "./firebase/admin";
import { getUserByUID } from "./user";
import { UserCache } from "./cache";
import { isUserAdmin } from "./auth/roleUtils";

/**
 * Get authenticated user from NextAuth session (zero extra fetches)
 * Uses role computed in JWT callback for instant admin checks
 */
export async function getServerUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }
  
  return {
    uid: (session.user as any).uid,
    email: session.user.email,
    role: (session.user as any).role || "user",
    name: session.user.name,
  };
}

/**
 * Check if current user is admin (zero extra fetches)
 * Uses role from NextAuth session computed in JWT
 */
export async function isServerAdmin(): Promise<boolean> {
  const user = await getServerUser();
  return isUserAdmin(user);
}

/**
 * Require admin access or redirect
 * For use in server components and API routes
 */
export async function requireServerAdmin() {
  const isAdmin = await isServerAdmin();
  if (!isAdmin) {
    throw new Error("Admin access required");
  }
}

// Legacy Firebase session cookie support (fallback)
export async function getServerUserLegacy() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value || cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Try cache first for fast response
    let userData = await UserCache.getUserByUid(decoded.uid);
    
    if (!userData) {
      // Cache miss - fetch from database
      userData = await getUserByUID(decoded.uid);
      
      // Cache the result for future requests
      if (userData) {
        await UserCache.setUserByUid(decoded.uid, userData);
      }
    }
    
    if (userData) {
      // Return standardized user data from Firestore
      return {
        uid: userData.uid,
        email: userData.email,
        role: userData.role
      };
    } else {
      // Fallback to token data if user document doesn't exist
      return {
        uid: decoded.uid,
        email: decoded.email || null,
        role: (decoded as any).role || "user"
      };
    }
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

/**
 * Get server user with enhanced error handling and caching
 * @returns User data or null if not authenticated
 */
export async function getServerUserOptimized() {
  // Try NextAuth session first (preferred)
  const nextAuthUser = await getServerUser();
  if (nextAuthUser) {
    return nextAuthUser;
  }
  
  // Fallback to legacy Firebase session cookie
  return await getServerUserLegacy();
}