import { cert, getApps, initializeApp, getApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required Firebase Admin environment variables: ${missingVars.join(', ')}`);
}

// Initialize Firebase Admin SDK
const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

// Export Firebase Admin services
export const adminDb = getFirestore(app);
export const adminAuth = getAdminAuth(app);
export const adminStorage = getStorage(app);

// Verify ID token function
export async function verifyIdToken(idToken: string) {
  try {
    return await adminAuth.verifyIdToken(idToken, true);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid or expired token');
  }
}

// Helper function to check if user is admin
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord.customClaims?.admin === true || userRecord.customClaims?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Set admin claims for a user
export async function setAdminClaims(uid: string, isAdmin: boolean = true) {
  try {
    await adminAuth.setCustomUserClaims(uid, { admin: isAdmin, role: isAdmin ? 'admin' : 'user' });
    return true;
  } catch (error) {
    console.error('Error setting admin claims:', error);
    throw new Error('Failed to set admin claims');
  }
}

// Export app instance
export default app;