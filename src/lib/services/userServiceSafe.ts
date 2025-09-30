/**
 * Enhanced User Service with Firestore Safety Net
 * 
 * This service demonstrates how to integrate the Firestore safety wrapper
 * into existing services for graceful handling of index building periods.
 */

import { doc, getDoc, updateDoc, DocumentData, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import { getUserByUID, updateUser, UserDocument, UserWithId } from "@/lib/user"
import { UserCache } from "@/lib/cache"
import { safeQuery, safeCollectionQuery, isIndexBuilding } from "@/lib/firestoreSafe"
import { db as adminDb } from "@/lib/firebase/admin"

// Legacy interface for backward compatibility
export interface UserProfile extends DocumentData {
  uid: string;
  displayName?: string;
  email: string;
  plan?: string;
  role: "admin" | "user";
  createdAt: Timestamp;
  avatarUrl?: string;
  updatedAt?: Date;
}

/**
 * Enhanced interface for service responses that may include index building status
 */
export interface UserServiceResponse<T> {
  data: T | null;
  indexBuilding?: boolean;
  message?: string;
  retryAfter?: number;
}

/**
 * Get user profile using optimized O(1) lookup with caching and safety net
 * @param uid - User ID
 * @returns User profile response with index building status
 */
export const getUserProfileSafe = async (uid: string): Promise<UserServiceResponse<UserProfile>> => {
  try {
    // Try cache first for fast response
    let cachedProfile = await UserCache.getProfile(uid);
    if (cachedProfile) {
      return { data: cachedProfile };
    }

    // Cache miss - use safe query wrapper for server-side lookup
    const result = await safeQuery(async () => {
      const user = await getUserByUID(uid);
      return user;
    });

    // Handle index building scenario
    if (isIndexBuilding(result)) {
      return {
        data: null,
        indexBuilding: true,
        message: result.message,
        retryAfter: result.retryAfter
      };
    }

    const user = result as UserWithId | null;
    if (!user) {
      return { data: null };
    }

    // Convert to legacy UserProfile format for backward compatibility
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt.toDate(),
      // Legacy fields (may not exist in new standardized format)
      displayName: (user as any).displayName,
      plan: (user as any).plan,
      avatarUrl: (user as any).avatarUrl
    };

    // Cache the profile for future requests
    await UserCache.setProfile(uid, profile);

    return { data: profile };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { data: null };
  }
}

/**
 * Get admin users with safety net for index building
 * @param limit - Maximum number of users to return
 * @returns Admin users response with index building status
 */
export const getAdminUsersSafe = async (limit: number = 50): Promise<UserServiceResponse<UserProfile[]>> => {
  try {
    const result = await safeCollectionQuery(async () =>
      adminDb.collection("users")
        .where("role", "==", "admin")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get()
    );

    // Handle index building (returns empty array)
    if (Array.isArray(result)) {
      return {
        data: [],
        indexBuilding: true,
        message: "Database indexes are building. Admin users will be available shortly.",
        retryAfter: 300000 // 5 minutes
      };
    }

    // Process normal results
    const adminUsers: UserProfile[] = result.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt?.toDate(),
        displayName: data.displayName,
        plan: data.plan,
        avatarUrl: data.avatarUrl
      };
    });

    return { data: adminUsers };
  } catch (error) {
    console.error("Error getting admin users:", error);
    return { data: null };
  }
}

/**
 * Search users by email with safety net
 * @param email - Email to search for
 * @returns User search response with index building status
 */
export const searchUsersByEmailSafe = async (email: string): Promise<UserServiceResponse<UserProfile[]>> => {
  try {
    const emailLower = email.toLowerCase();
    
    const result = await safeCollectionQuery(async () =>
      adminDb.collection("users")
        .where("email", "==", emailLower)
        .orderBy("createdAt", "desc")
        .get()
    );

    // Handle index building (returns empty array)
    if (Array.isArray(result)) {
      return {
        data: [],
        indexBuilding: true,
        message: "Search indexes are building. User search will be available shortly.",
        retryAfter: 180000 // 3 minutes
      };
    }

    // Process normal results
    const users: UserProfile[] = result.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt?.toDate(),
        displayName: data.displayName,
        plan: data.plan,
        avatarUrl: data.avatarUrl
      };
    });

    return { data: users };
  } catch (error) {
    console.error("Error searching users by email:", error);
    return { data: null };
  }
}

/**
 * Get users by role with safety net and pagination
 * @param role - User role to filter by
 * @param limit - Maximum number of users to return
 * @param startAfter - Document to start after for pagination
 * @returns Users response with index building status
 */
export const getUsersByRoleSafe = async (
  role: "admin" | "user",
  limit: number = 100,
  startAfter?: any
): Promise<UserServiceResponse<{ users: UserProfile[], hasMore: boolean }>> => {
  try {
    const result = await safeQuery(async () => {
      let query = adminDb.collection("users")
        .where("role", "==", role)
        .orderBy("email", "asc")
        .limit(limit + 1); // Get one extra to check if there are more

      if (startAfter) {
        query = query.startAfter(startAfter);
      }

      return query.get();
    });

    // Handle index building
    if (isIndexBuilding(result)) {
      return {
        data: { users: [], hasMore: false },
        indexBuilding: true,
        message: result.message,
        retryAfter: result.retryAfter
      };
    }

    const querySnapshot = result as FirebaseFirestore.QuerySnapshot;
    const docs = querySnapshot.docs;
    const hasMore = docs.length > limit;
    
    // Remove the extra document if present
    if (hasMore) {
      docs.pop();
    }

    const users: UserProfile[] = docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt?.toDate(),
        displayName: data.displayName,
        plan: data.plan,
        avatarUrl: data.avatarUrl
      };
    });

    return { 
      data: { users, hasMore }
    };
  } catch (error) {
    console.error("Error getting users by role:", error);
    return { data: null };
  }
}

/**
 * Update user profile using optimized update function with safety net
 * @param uid - User ID
 * @param data - Partial user data to update
 */
export const updateUserProfileSafe = async (uid: string, data: Partial<UserProfile>): Promise<UserServiceResponse<boolean>> => {
  try {
    // Extract standardized fields
    const standardizedUpdates: Partial<Pick<UserDocument, "email" | "role">> = {};
    
    if (data.email) {
      standardizedUpdates.email = data.email;
    }
    
    if (data.role) {
      standardizedUpdates.role = data.role;
    }

    // Use safe query wrapper for standardized updates
    if (Object.keys(standardizedUpdates).length > 0) {
      const result = await safeQuery(async () => {
        await updateUser(uid, standardizedUpdates);
        return true;
      });

      // Handle index building during update
      if (isIndexBuilding(result)) {
        return {
          data: false,
          indexBuilding: true,
          message: "User update is temporarily unavailable while indexes are building.",
          retryAfter: result.retryAfter
        };
      }
    }

    // Handle legacy fields that aren't in the standardized structure
    const legacyFields: any = {};
    if (data.displayName !== undefined) legacyFields.displayName = data.displayName;
    if (data.plan !== undefined) legacyFields.plan = data.plan;
    if (data.avatarUrl !== undefined) legacyFields.avatarUrl = data.avatarUrl;

    // Update legacy fields directly if any exist
    if (Object.keys(legacyFields).length > 0) {
      if (!db) {
        console.error("Firestore DB is not initialized.");
        return { data: false };
      }
      
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { 
        ...legacyFields, 
        updatedAt: new Date() 
      });
    }

    // Invalidate cache after successful update
    await UserCache.invalidateUser(data.email, uid);

    console.log("User profile updated successfully!");
    return { data: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { data: false };
  }
}

/**
 * Utility function to handle service responses in components
 * @param response - Service response
 * @param onSuccess - Callback for successful data
 * @param onIndexBuilding - Callback for index building state
 * @param onError - Callback for errors
 */
export const handleUserServiceResponse = <T>(
  response: UserServiceResponse<T>,
  onSuccess: (data: T) => void,
  onIndexBuilding?: (message: string, retryAfter?: number) => void,
  onError?: () => void
) => {
  if (response.indexBuilding) {
    onIndexBuilding?.(
      response.message || "Database is updating. Please try again in a few minutes.",
      response.retryAfter
    );
  } else if (response.data !== null) {
    onSuccess(response.data);
  } else {
    onError?.();
  }
};

// Export the original functions for backward compatibility
export { getUserProfile, updateUserProfile } from "./userService";