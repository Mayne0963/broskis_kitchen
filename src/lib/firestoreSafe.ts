import { admin } from "@/lib/firebase/admin";

// Firestore error codes
const FAILED_PRECONDITION = 9;

/**
 * Safety-net wrapper for Firestore queries that handles missing indexes gracefully.
 * 
 * When Firestore indexes are still building, queries can fail with FAILED_PRECONDITION (code 9).
 * This wrapper catches those errors and returns a placeholder response instead of throwing,
 * allowing the application to continue functioning while indexes are being built.
 * 
 * @param fn - Async function that performs the Firestore query
 * @returns Promise that resolves to the query result or a placeholder object
 * 
 * @example
 * ```typescript
 * import { db } from "@/lib/firebase/admin";
 * import { safeQuery } from "@/lib/firestoreSafe";
 * 
 * const result = await safeQuery(async () => 
 *   db.collection("users")
 *     .where("role", "==", "admin")
 *     .orderBy("createdAt", "desc")
 *     .limit(50)
 *     .get()
 * );
 * 
 * // Check if index is still building
 * if ('buildingIndex' in result) {
 *   console.log("Index still building, showing fallback UI");
 *   return;
 * }
 * 
 * // Process normal result
 * result.docs.forEach(doc => console.log(doc.data()));
 * ```
 */
export async function safeQuery<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    // Check if this is a Firestore FAILED_PRECONDITION error (index still building)
    if (e?.code === FAILED_PRECONDITION || e?.code === 'failed-precondition') {
      console.warn("Firestore index still building:", e?.message || e);
      
      // Return a harmless placeholder that indicates the index is building
      // This allows the application to handle the case gracefully
      // @ts-ignore - We know this isn't the correct type, but it's a safe fallback
      return { buildingIndex: true, message: "Index is still building" } as T;
    }
    
    // Re-throw all other errors
    throw e;
  }
}

/**
 * Type guard to check if a query result indicates a building index
 */
export function isBuildingIndex(result: any): result is { buildingIndex: true; message: string } {
  return result && typeof result === 'object' && result.buildingIndex === true;
}

/**
 * Wrapper specifically for Firestore QuerySnapshot results
 * Provides better typing for the most common use case
 */
export async function safeQuerySnapshot(
  fn: () => Promise<admin.firestore.QuerySnapshot>
): Promise<admin.firestore.QuerySnapshot | { buildingIndex: true; message: string }> {
  return safeQuery(fn);
}

/**
 * Wrapper specifically for Firestore DocumentSnapshot results
 */
export async function safeDocumentQuery(
  fn: () => Promise<admin.firestore.DocumentSnapshot>
): Promise<admin.firestore.DocumentSnapshot | { buildingIndex: true; message: string }> {
  return safeQuery(fn);
}

/**
 * Helper to safely execute a query and return docs array or empty array if building
 */
export async function safeQueryDocs<T = any>(
  fn: () => Promise<admin.firestore.QuerySnapshot>
): Promise<admin.firestore.QueryDocumentSnapshot<T>[]> {
  const result = await safeQuerySnapshot(fn);
  
  if (isBuildingIndex(result)) {
    console.warn("Index building, returning empty docs array");
    return [];
  }
  
  return result.docs as admin.firestore.QueryDocumentSnapshot<T>[];
}

/**
 * Helper to safely execute a query and return data array or empty array if building
 */
export async function safeQueryData<T = any>(
  fn: () => Promise<admin.firestore.QuerySnapshot>
): Promise<T[]> {
  const docs = await safeQueryDocs<T>(fn);
  return docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}