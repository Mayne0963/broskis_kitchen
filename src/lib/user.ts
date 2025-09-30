/**
 * Firebase User Management Utilities
 * 
 * Standardized user document structure and optimized query functions
 * for O(1) auth-related lookups with proper indexing.
 * 
 * Required Firebase Indexes:
 * 1. Collection: users
 *    - Single-field index: email (ASC) - REQUIRED
 * 2. Composite indexes (if querying by role):
 *    - Fields: role (ASC), email (ASC)
 *    - Fields: role (ASC), createdAt (DESC)
 * 
 * User Document Structure (Firestore: users/{uid}):
 * {
 *   uid: string,           // doc id = uid
 *   email: string,         // lowercased, unique
 *   role: "admin" | "user", // for fast role checks
 *   createdAt: Timestamp,  // server timestamp
 *   updatedAt: Timestamp   // server timestamp
 * }
 */

import { db, admin } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// Standardized user document interface
export interface UserDocument {
  uid: string;
  email: string;
  role: "admin" | "user";
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// User document with Firestore document ID
export interface UserWithId extends UserDocument {
  id: string;
}

// Input type for creating/updating users
export interface UserInput {
  uid: string;
  email: string;
  role?: "admin" | "user";
}

/**
 * Get user by UID - O(1) lookup using document ID
 * @param uid - User ID
 * @returns User document or null if not found
 */
export async function getUserByUID(uid: string): Promise<UserWithId | null> {
  try {
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) {
      return null;
    }
    
    const data = snap.data() as UserDocument;
    return {
      id: snap.id,
      ...data
    };
  } catch (error) {
    console.error("Error getting user by UID:", error);
    throw new Error(`Failed to get user by UID: ${uid}`);
  }
}

/**
 * Get user by email - O(1) lookup using indexed email field
 * @param email - User email (will be lowercased)
 * @returns User document or null if not found
 */
export async function getUserByEmail(email: string): Promise<UserWithId | null> {
  try {
    const normalizedEmail = email.toLowerCase();
    const q = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();
    
    if (q.empty) {
      return null;
    }
    
    const doc = q.docs[0];
    const data = doc.data() as UserDocument;
    return {
      id: doc.id,
      ...data
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw new Error(`Failed to get user by email: ${email}`);
  }
}

/**
 * Create a new user document with standardized structure
 * @param userInput - User data
 * @returns Created user document
 */
export async function createUser(userInput: UserInput): Promise<UserWithId> {
  try {
    const { uid, email, role = "user" } = userInput;
    const normalizedEmail = email.toLowerCase();
    
    const userData: Omit<UserDocument, "createdAt" | "updatedAt"> = {
      uid,
      email: normalizedEmail,
      role
    };
    
    const timestamp = FieldValue.serverTimestamp();
    const userDoc = {
      ...userData,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await db.collection("users").doc(uid).set(userDoc);
    
    // Return the created user (with actual timestamps)
    const created = await getUserByUID(uid);
    if (!created) {
      throw new Error("Failed to retrieve created user");
    }
    
    return created;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error(`Failed to create user: ${userInput.uid}`);
  }
}

/**
 * Update user document with standardized structure
 * @param uid - User ID
 * @param updates - Partial user data to update
 * @returns Updated user document
 */
export async function updateUser(
  uid: string, 
  updates: Partial<Pick<UserDocument, "email" | "role">>
): Promise<UserWithId> {
  try {
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    };
    
    if (updates.email) {
      updateData.email = updates.email.toLowerCase();
    }
    
    if (updates.role) {
      updateData.role = updates.role;
    }
    
    await db.collection("users").doc(uid).update(updateData);
    
    // Return the updated user
    const updated = await getUserByUID(uid);
    if (!updated) {
      throw new Error("Failed to retrieve updated user");
    }
    
    // Invalidate cache after successful update
    const { UserCache } = await import("./cache");
    await UserCache.invalidateUser(updated.email, uid);
    
    return updated;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error(`Failed to update user: ${uid}`);
  }
}

/**
 * Set custom claims for user authentication
 * @param uid - User ID
 * @param role - User role
 */
export async function setUserCustomClaims(uid: string, role: "admin" | "user"): Promise<void> {
  try {
    await admin.auth().setCustomUserClaims(uid, { role });
  } catch (error) {
    console.error("Error setting custom claims:", error);
    throw new Error(`Failed to set custom claims for user: ${uid}`);
  }
}

/**
 * Synchronize user role between Firestore and Auth custom claims
 * @param uid - User ID
 * @param role - New role
 */
export async function syncUserRole(uid: string, role: "admin" | "user"): Promise<UserWithId> {
  try {
    // Update Firestore document
    const updatedUser = await updateUser(uid, { role });
    
    // Update Auth custom claims
    await setUserCustomClaims(uid, role);
    
    return updatedUser;
  } catch (error) {
    console.error("Error syncing user role:", error);
    throw new Error(`Failed to sync role for user: ${uid}`);
  }
}

/**
 * Create or update user document (upsert operation)
 * @param userInput - User data
 * @returns User document
 */
export async function upsertUser(userInput: UserInput): Promise<UserWithId> {
  try {
    const existingUser = await getUserByUID(userInput.uid);
    
    if (existingUser) {
      // Update existing user
      return await updateUser(userInput.uid, {
        email: userInput.email,
        role: userInput.role
      });
    } else {
      // Create new user
      return await createUser(userInput);
    }
  } catch (error) {
    console.error("Error upserting user:", error);
    throw new Error(`Failed to upsert user: ${userInput.uid}`);
  }
}

/**
 * Get users by role with pagination - uses indexed role field
 * @param role - User role to filter by
 * @param limit - Number of users to return
 * @param startAfter - Document to start after (for pagination)
 * @returns Array of user documents
 */
export async function getUsersByRole(
  role: "admin" | "user",
  limit: number = 50,
  startAfter?: FirebaseFirestore.DocumentSnapshot
): Promise<UserWithId[]> {
  try {
    let query = db
      .collection("users")
      .where("role", "==", role)
      .orderBy("createdAt", "desc")
      .limit(limit);
    
    if (startAfter) {
      query = query.startAfter(startAfter);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as UserDocument
    }));
  } catch (error) {
    console.error("Error getting users by role:", error);
    throw new Error(`Failed to get users by role: ${role}`);
  }
}

/**
 * Delete user document
 * @param uid - User ID
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    await db.collection("users").doc(uid).delete();
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error(`Failed to delete user: ${uid}`);
  }
}

/**
 * Batch get users by UIDs - optimized for multiple lookups
 * @param uids - Array of user IDs
 * @returns Array of user documents (null for not found)
 */
export async function getUsersByUIDs(uids: string[]): Promise<(UserWithId | null)[]> {
  try {
    if (uids.length === 0) return [];
    
    // Firestore batch get is limited to 500 documents
    const batchSize = 500;
    const results: (UserWithId | null)[] = [];
    
    for (let i = 0; i < uids.length; i += batchSize) {
      const batchUids = uids.slice(i, i + batchSize);
      const docRefs = batchUids.map(uid => db.collection("users").doc(uid));
      const snapshots = await db.getAll(...docRefs);
      
      const batchResults = snapshots.map(snap => {
        if (!snap.exists) return null;
        const data = snap.data() as UserDocument;
        return {
          id: snap.id,
          ...data
        };
      });
      
      results.push(...batchResults);
    }
    
    return results;
  } catch (error) {
    console.error("Error getting users by UIDs:", error);
    throw new Error("Failed to get users by UIDs");
  }
}

/**
 * Search users by email with pagination - uses indexed email field
 * @param emailQuery - Email search query (partial match)
 * @param limit - Number of users to return
 * @param startAfter - Document to start after (for pagination)
 * @returns Array of user documents
 */
export async function searchUsersByEmail(
  emailQuery: string,
  limit: number = 50,
  startAfter?: FirebaseFirestore.DocumentSnapshot
): Promise<UserWithId[]> {
  try {
    const normalizedQuery = emailQuery.toLowerCase();
    
    // For exact email matches, use the indexed email field
    if (normalizedQuery.includes("@")) {
      const user = await getUserByEmail(normalizedQuery);
      return user ? [user] : [];
    }
    
    // For partial matches, we need to use range queries
    // This requires the email field to be indexed
    let query = db
      .collection("users")
      .where("email", ">=", normalizedQuery)
      .where("email", "<=", normalizedQuery + "\uf8ff")
      .orderBy("email")
      .limit(limit);
    
    if (startAfter) {
      query = query.startAfter(startAfter);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as UserDocument
    }));
  } catch (error) {
    console.error("Error searching users by email:", error);
    throw new Error(`Failed to search users by email: ${emailQuery}`);
  }
}

/**
 * Get user statistics for admin dashboard
 * @returns User statistics
 */
export async function getUserStats(): Promise<{
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number; // Users created in last 30 days
}> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all users count
    const allUsersSnapshot = await db.collection("users").count().get();
    const totalUsers = allUsersSnapshot.data().count;
    
    // Get admin users count
    const adminUsersSnapshot = await db
      .collection("users")
      .where("role", "==", "admin")
      .count()
      .get();
    const adminUsers = adminUsersSnapshot.data().count;
    
    // Get regular users count
    const regularUsers = totalUsers - adminUsers;
    
    // Get recent users count
    const recentUsersSnapshot = await db
      .collection("users")
      .where("createdAt", ">=", thirtyDaysAgo)
      .count()
      .get();
    const recentUsers = recentUsersSnapshot.data().count;
    
    return {
      totalUsers,
      adminUsers,
      regularUsers,
      recentUsers
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw new Error("Failed to get user statistics");
  }
}

/**
 * Bulk update user roles - optimized for admin operations
 * @param updates - Array of user ID and role updates
 * @returns Array of updated users
 */
export async function bulkUpdateUserRoles(
  updates: Array<{ uid: string; role: "admin" | "user" }>
): Promise<UserWithId[]> {
  try {
    const batch = db.batch();
    const timestamp = FieldValue.serverTimestamp();
    
    // Prepare batch updates
    updates.forEach(({ uid, role }) => {
      const userRef = db.collection("users").doc(uid);
      batch.update(userRef, {
        role,
        updatedAt: timestamp
      });
    });
    
    // Execute batch update
    await batch.commit();
    
    // Update custom claims for all users
    const customClaimsPromises = updates.map(({ uid, role }) =>
      setUserCustomClaims(uid, role)
    );
    await Promise.all(customClaimsPromises);
    
    // Return updated users
    const uids = updates.map(u => u.uid);
    const updatedUsers = await getUsersByUIDs(uids);
    
    // Invalidate cache for all updated users
    const { UserCache } = await import("./cache");
    for (const user of updatedUsers) {
      if (user) {
        await UserCache.invalidateUser(user.email, user.uid);
      }
    }
    
    return updatedUsers.filter(user => user !== null) as UserWithId[];
  } catch (error) {
    console.error("Error bulk updating user roles:", error);
    throw new Error("Failed to bulk update user roles");
  }
}

/**
 * Create user from Firebase Auth user - for auth triggers
 * @param authUser - Firebase Auth user
 * @param role - Initial role (defaults to "user")
 * @returns Created user document
 */
export async function createUserFromAuth(
  authUser: { uid: string; email: string | null },
  role: "admin" | "user" = "user"
): Promise<UserWithId> {
  try {
    if (!authUser.email) {
      throw new Error("User email is required");
    }
    
    const userInput: UserInput = {
      uid: authUser.uid,
      email: authUser.email,
      role
    };
    
    // Create user document
    const createdUser = await createUser(userInput);
    
    // Set custom claims
    await setUserCustomClaims(authUser.uid, role);
    
    return createdUser;
  } catch (error) {
    console.error("Error creating user from auth:", error);
    throw new Error(`Failed to create user from auth: ${authUser.uid}`);
  }
}

/**
 * Sync all users' custom claims with their Firestore role
 * Admin utility for data consistency
 * @param batchSize - Number of users to process at once
 */
export async function syncAllUserCustomClaims(batchSize: number = 100): Promise<void> {
  try {
    let lastDoc: FirebaseFirestore.DocumentSnapshot | undefined;
    let processedCount = 0;
    
    do {
      let query = db
        .collection("users")
        .orderBy("createdAt")
        .limit(batchSize);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        break;
      }
      
      // Process batch
      const customClaimsPromises = snapshot.docs.map(doc => {
        const userData = doc.data() as UserDocument;
        return setUserCustomClaims(userData.uid, userData.role);
      });
      
      await Promise.all(customClaimsPromises);
      
      processedCount += snapshot.docs.length;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      console.log(`Synced custom claims for ${processedCount} users`);
      
    } while (lastDoc);
    
    console.log(`Completed syncing custom claims for ${processedCount} total users`);
  } catch (error) {
    console.error("Error syncing all user custom claims:", error);
    throw new Error("Failed to sync all user custom claims");
  }
}