import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { cookies, headers } from "next/headers";
import { adminAuth } from "./firebase/admin";
import { getUserByUID } from "./user";
import { UserCache } from "./cache";

export type ServerUser = {
  uid: string;
  email: string | null;
  role?: string;
  name?: string | null;
};

/**
 * Get authenticated user - prioritizes Firebase session cookie over NextAuth
 * This ensures compatibility with Firebase Authentication used throughout the app
 */
export async function getServerUser(): Promise<ServerUser | null> {
  // Try Firebase session cookie first (primary auth method)
  const firebaseUser = await getServerUserLegacy();
  if (firebaseUser) {
    return firebaseUser;
  }
  
  // Fallback to NextAuth session (if configured)
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const bearerUser = await getUserFromAuthorizationHeader();
    if (bearerUser) {
      return bearerUser;
    }
    return null;
  }

  const sessionUid = (session.user as any).uid || session.user.email || null;
  if (!sessionUid) {
    const bearerUser = await getUserFromAuthorizationHeader();
    if (bearerUser) {
      return bearerUser;
    }
    return null;
  }

  const fallback: ServerUser = {
    uid: sessionUid,
    email: session.user.email,
    role: (session.user as any).role || "user",
    name: session.user.name,
  };
  return fallback;
}

async function getUserFromAuthorizationHeader(): Promise<ServerUser | null> {
  try {
    const headerStore = headers();
    const headerValue = headerStore.get("authorization") || headerStore.get("Authorization");
    if (!headerValue) {
      return null;
    }
    const match = headerValue.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return null;
    }
    const decoded = await adminAuth.verifyIdToken(match[1], true);
    return {
      uid: decoded.uid,
      email: decoded.email || null,
      role: (decoded as any).role || ((decoded as any).admin ? "admin" : "user"),
      name: decoded.name || decoded.email || null,
    };
  } catch (error) {
    console.warn("[authServer] Authorization header verification failed", (error as any)?.message || error);
    return null;
  }
}

/**
 * Check if current user is admin (zero extra fetches)
 * Uses role from NextAuth session computed in JWT
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

// Legacy Firebase session cookie support (fallback)
export async function getServerUserLegacy(): Promise<ServerUser | null> {
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
        role: userData.role,
        name: userData.name || decoded.name || null,
      };
    } else {
      // Fallback to token data if user document doesn't exist
      return {
        uid: decoded.uid,
        email: decoded.email || null,
        role: (decoded as any).role || ((decoded as any).admin ? "admin" : "user"),
        name: decoded.name || decoded.email || null,
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
  return await getServerUser();
}
