import { adminAuth } from "@/lib/firebase/admin";
import { ENV } from "@/lib/env";

export interface FirebaseUserClaims {
  uid: string;
  email?: string;
  admin?: boolean;
  [key: string]: any;
}

/**
 * Verify Firebase ID token and extract custom claims
 * @param idToken Firebase ID token
 * @returns Decoded token with custom claims
 */
export async function verifyFirebaseToken(idToken: string): Promise<FirebaseUserClaims | null> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      admin: (decodedToken as any).admin || false,
      ...decodedToken,
    };
  } catch (error) {
    console.error("Failed to verify Firebase ID token:", error);
    return null;
  }
}

/**
 * Get user role from Firebase custom claims
 * @param uid User ID
 * @returns User role based on Firebase custom claims
 */
export async function getFirebaseUserRole(uid: string): Promise<"admin" | "user"> {
  try {
    const user = await adminAuth.getUser(uid);
    const customClaims = user.customClaims || {};
    return customClaims.admin ? "admin" : "user";
  } catch (error) {
    console.error("Failed to get Firebase user role:", error);
    return "user";
  }
}

/**
 * Set custom claims for a user (admin elevation)
 * @param uid User ID
 * @param claims Custom claims to set
 */
export async function setFirebaseCustomClaims(uid: string, claims: Record<string, any>): Promise<void> {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    console.log(`Successfully set custom claims for user ${uid}:`, claims);
  } catch (error) {
    console.error(`Failed to set custom claims for user ${uid}:`, error);
    throw error;
  }
}

/**
 * Resolve user role using both Firebase custom claims and email allowlist
 * Prefers Firebase custom claims for real-time accuracy
 * @param uid User ID
 * @param email User email
 * @returns Resolved user role
 */
export async function resolveUserRole(uid: string, email?: string): Promise<"admin" | "user"> {
  try {
    // First try to get role from Firebase custom claims
    const firebaseRole = await getFirebaseUserRole(uid);
    if (firebaseRole === "admin") {
      return "admin";
    }

    // Fallback to email allowlist if Firebase claims don't indicate admin
    if (email) {
      const isAllowlisted = ENV.ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
      return isAllowlisted ? "admin" : "user";
    }

    return "user";
  } catch (error) {
    console.error("Failed to resolve user role:", error);
    // Final fallback to email allowlist
    if (email) {
      return ENV.ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
    }
    return "user";
  }
}

/**
 * Log authentication discrepancy for monitoring
 * @param context Context of the discrepancy
 * @param firebaseClaims Firebase custom claims
 * @param nextAuthRole NextAuth role
 */
export function logAuthDiscrepancy(
  context: string,
  firebaseClaims?: { admin?: boolean },
  nextAuthRole?: string
): void {
  console.warn(`Auth discrepancy detected in ${context}:`, {
    firebaseAdmin: firebaseClaims?.admin,
    nextAuthRole,
    timestamp: new Date().toISOString(),
  });
}