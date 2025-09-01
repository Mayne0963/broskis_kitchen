import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let pk = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
if (pk.includes('\\n')) pk = pk.replace(/\\n/g, '\n');

export function ensureAdmin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: pk
      })
    });
  }
}

// Initialize admin app
ensureAdmin();

// Get the initialized app
const app = getApps()[0]!;

// Export database and auth instances for backward compatibility
export const adb = getFirestore(app);
export const db = adb; // alias for compatibility
export const adminAuth = getAuth(app);
export const auth = adminAuth; // alias for compatibility