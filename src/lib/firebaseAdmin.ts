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
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!rawKey || !projectId || !clientEmail) {
      throw new Error(
        'Missing Firebase Admin SDK environment variables. Ensure FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID, and FIREBASE_CLIENT_EMAIL are set.'
      );
    }
    // Replace escaped newlines with actual newlines
    const privateKey = rawKey.replace(/\n/g, '\n');

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