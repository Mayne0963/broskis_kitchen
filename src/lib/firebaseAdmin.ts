import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App | null = null;

export function initAdmin() {
  if (!app) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) throw new Error('Missing Firebase Admin env vars');
    app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return app!;
}

// Initialize and export services
initAdmin();
export const auth = getAuth();
export const adminAuth = getAuth();
export const db = getFirestore();
export const adb = getFirestore();