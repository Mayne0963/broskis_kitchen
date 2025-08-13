/**
 * Firebase Admin SDK configuration for server-side operations
 * Used in API routes and server-side functions
 */

import { cert, getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getValidatedAdminConfig } from './env-validation';

// Initialize Firebase Admin app
let app;
try {
  const config = getValidatedAdminConfig();
  
  app = getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey
        })
      })
    : getApp();
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  throw error;
}

// Export Firebase Admin services
export const adminDb = getFirestore(app);
export const adminAuth = getAdminAuth(app);

/**
 * Verifies a Firebase ID token and returns the decoded token
 * @param idToken - The Firebase ID token to verify
 * @param checkRevoked - Whether to check if the token has been revoked
 * @returns Promise<DecodedIdToken> - The decoded token with user claims
 */
export async function verifyIdToken(idToken: string, checkRevoked: boolean = true) {
  try {
    return await adminAuth.verifyIdToken(idToken, checkRevoked);
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

/**
 * Sets custom claims for a user (e.g., admin role)
 * @param uid - User ID
 * @param claims - Custom claims to set
 */
export async function setCustomUserClaims(uid: string, claims: Record<string, any>) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error('Failed to set custom claims:', error);
    throw error;
  }
}

/**
 * Gets a user by their UID
 * @param uid - User ID
 * @returns Promise<UserRecord> - The user record
 */
export async function getUser(uid: string) {
  try {
    return await adminAuth.getUser(uid);
  } catch (error) {
    console.error('Failed to get user:', error);
    throw error;
  }
}

// Export the app instance
export default app;