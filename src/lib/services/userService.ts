import { doc, getDoc, updateDoc, DocumentData, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import { getUserByUID, updateUser, UserDocument, UserWithId } from "@/lib/user"
import { UserCache } from "@/lib/cache"

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
 * Get user profile using optimized O(1) lookup with caching
 * @param uid - User ID
 * @returns User profile or null if not found
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // Try cache first for fast response
    const cachedProfile = await UserCache.getProfile(uid);
    if (cachedProfile) {
      return cachedProfile;
    }

    // Cache miss - use optimized server-side lookup for better performance
    const user = await getUserByUID(uid);
    if (!user) {
      return null;
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

    return profile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Update user profile using optimized update function
 * @param uid - User ID
 * @param data - Partial user data to update
 */
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    // Extract standardized fields
    const standardizedUpdates: Partial<Pick<UserDocument, "email" | "role">> = {};
    
    if (data.email) {
      standardizedUpdates.email = data.email;
    }
    
    if (data.role) {
      standardizedUpdates.role = data.role;
    }

    // Use optimized update function for standardized fields
    if (Object.keys(standardizedUpdates).length > 0) {
      await updateUser(uid, standardizedUpdates);
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
        return;
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
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}