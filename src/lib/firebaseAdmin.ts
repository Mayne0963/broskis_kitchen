import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const phase = process.env.NEXT_PHASE;
const isBuildTime = phase === 'phase-production-build';

// Mock implementations for build time
const mockAuth = {
  verifyIdToken: async () => ({ uid: 'dummy', email_verified: true, firebase: { sign_in_provider: 'custom' } }),
  createSessionCookie: async () => 'dummy-cookie',
  verifySessionCookie: async () => ({ uid: 'dummy' }),
  revokeRefreshTokens: async () => {},
};

const mockDb = {
  collection: () => ({
    doc: () => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async () => {},
      update: async () => {},
      delete: async () => {},
    }),
    add: async () => ({ id: 'mock-id' }),
    where: () => ({ get: async () => ({ docs: [] }) }),
  }),
};

export const adminAuth = () => {
  if (isBuildTime) {
    return mockAuth;
  }

  if (!getApps().length) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!rawKey || !projectId || !clientEmail) {
      console.warn('Missing Firebase Admin SDK environment variables. Using mock auth.');
      return mockAuth;
    }
    
    try {
      // Replace escaped newlines with actual newlines
      const privateKey = rawKey.replace(/\\n/g, "\n");

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.warn('Failed to initialize Firebase Admin SDK:', error);
      return mockAuth;
    }
  }
  return getAuth();
};

export const auth = adminAuth();
export const db = isBuildTime ? mockDb : getFirestore();
