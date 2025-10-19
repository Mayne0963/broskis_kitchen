import { cookies, headers } from "next/headers";
import { adminAuth } from "./firebase/admin";
import { getUserByUID } from "./user";
import { UserCache } from "./cache";

/**
 * Get authenticated user from Firebase session cookie (zero extra fetches)
 * Uses role from custom claims for instant admin checks
 */
export async function getServerUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value || cookieStore.get("session")?.value;
  
  if (!sessionCookie) {
    return null;
  }

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
        role: userData.role,
        name: userData.name || userData.email?.split('@')[0]
      };
    } else {
      // Fallback to token data if user document doesn't exist
      return {
        uid: decoded.uid,
        email: decoded.email || null,
        role: (decoded as any).role || "user",
        name: (decoded as any).name || decoded.email?.split('@')[0]
      };
    }
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

/**
 * Check if current user is admin (zero extra fetches)
 * Uses role from Firebase session cookie
 */
export async function isServerAdmin(): Promise<boolean> {
  const user = await getServerUser();
  return user?.role === "admin";
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