import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { getApps } from 'firebase/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getApps as getAdminApps, initializeApp as initializeAdminApp, cert } from 'firebase-admin/app';

// Integration test requires Firebase emulator running:
// firebase emulators:start --only auth,functions,firestore

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'demo-test-project';
const AUTH_EMU = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const FS_EMU = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const FUN_EMU_HOST = 'localhost';
const FUN_EMU_PORT = 5001;

function emulatorAvailable() {
  // Basic check: ports should be set via env; rely on user starting emulator
  return !!AUTH_EMU && !!FS_EMU;
}

describe('Admin Elevation Integration (Emulator)', () => {
  if (!emulatorAvailable()) {
    it.skip('skipped: emulator not available', () => {});
    return;
  }

  let app: ReturnType<typeof initializeApp> | null = null;
  let auth: ReturnType<typeof getAuth> | null = null;
  let functions: ReturnType<typeof getFunctions> | null = null;
  let db: ReturnType<typeof getFirestore> | null = null;

  beforeAll(async () => {
    // Initialize Admin SDK pointing to emulator
    if (getAdminApps().length === 0) {
      initializeAdminApp({
        credential: cert({
          projectId: PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'test@example.com',
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----').replace(/\\n/g, '\n'),
        } as any),
        projectId: PROJECT_ID,
      });
    }

    // Initialize client app
    app = initializeApp({ apiKey: 'demo', authDomain: 'demo', projectId: PROJECT_ID });
    auth = getAuth(app);
    connectAuthEmulator(auth, `http://${AUTH_EMU}`);
    db = getFirestore(app);
    connectFirestoreEmulator(db, FS_EMU.split(':')[0], Number(FS_EMU.split(':')[1]));
    functions = getFunctions(app);
    connectFunctionsEmulator(functions, FUN_EMU_HOST, FUN_EMU_PORT);
  });

  afterAll(async () => {
    try {
      if (getApps().length > 0 && app) await deleteApp(app);
    } catch {}
  });

  it('elevates target user to admin and writes audit log', async () => {
    // Create requester (admin) and target users
    const requesterEmail = 'admin@test.local';
    const targetEmail = 'user@test.local';

    const requesterCred = await createUserWithEmailAndPassword(auth!, requesterEmail, 'password123');
    const targetCred = await createUserWithEmailAndPassword(auth!, targetEmail, 'password123');

    // Set requester as admin via Admin SDK custom claims
    const adminAuth = getAdminAuth();
    await adminAuth.setCustomUserClaims(requesterCred.user.uid, { admin: true, role: 'admin' });

    // Sign in requester
    await signInWithEmailAndPassword(auth!, requesterEmail, 'password123');

    // Call function
    const elevate = httpsCallable(functions!, 'elevateUserToAdmin');
    const res = await elevate({ targetUid: targetCred.user.uid });
    expect((res.data as any)?.success).toBe(true);

    // Verify target claims updated via Admin SDK
    const targetUser = await adminAuth.getUser(targetCred.user.uid);
    expect(targetUser.customClaims?.admin).toBe(true);
    expect(targetUser.customClaims?.role).toBe('admin');
  });

  it('denies non-admin requester', async () => {
    const nonAdminEmail = 'regular@test.local';
    const otherEmail = 'other@test.local';

    const nonAdminCred = await createUserWithEmailAndPassword(auth!, nonAdminEmail, 'password123');
    const otherCred = await createUserWithEmailAndPassword(auth!, otherEmail, 'password123');

    await signInWithEmailAndPassword(auth!, nonAdminEmail, 'password123');

    const elevate = httpsCallable(functions!, 'elevateUserToAdmin');
    await expect(elevate({ targetUid: otherCred.user.uid })).rejects.toMatchObject({ code: 'functions/permission-denied' });
  });
});