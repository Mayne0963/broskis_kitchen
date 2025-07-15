import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const adminAuth = () => {
  const phase = process.env.NEXT_PHASE;
  if (phase === 'phase-production-build') {
    return {
      verifyIdToken: async () => ({ uid: 'dummy', email_verified: true, firebase: { sign_in_provider: 'custom' } }),
      createSessionCookie: async () => 'dummy-cookie',
      verifySessionCookie: async () => ({ uid: 'dummy' }),
      revokeRefreshTokens: async () => {},
    };
  }

  if (!getApps().length) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!rawKey) {
      throw new Error('FIREBASE_PRIVATE_KEY env var is missing');
    }
    const privateKey = rawKey.replace(/\n/g, '\n');

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID env var is missing');
    }

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    if (!clientEmail) {
      throw new Error('FIREBASE_CLIENT_EMAIL env var is missing');
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return getAuth();
};