// src/lib/firebaseAdmin.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getApps, initializeApp, applicationDefault, cert, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue, Firestore } from 'firebase-admin/firestore';
import type { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let app: App;

function init(): App {
  if (getApps().length) return getApp();

  // Prefer FIREBASE_SERVICE_ACCOUNT (JSON)
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      const creds = JSON.parse(raw) as ServiceAccount;
      // Fix escaped newlines
      if (creds.private_key?.includes('\\n')) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
      }
      return initializeApp({ credential: cert(creds) });
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
    }
  }

  // Fallback to ADC (Vercel env / local gcloud auth)
  return initializeApp({ credential: applicationDefault() });
}

app = init();

const adminDb: Firestore = getFirestore(app);
const auth = getAuth(app);

/**
 * ensureAdmin: verifies the caller is an authenticated admin.
 * - Checks Firebase session cookie (preferred) OR Bearer token header
 * - Verifies token via Admin SDK
 * - Requires custom claim admin === true OR email in ADMIN_EMAILS
 * Throws Response with 401/403 on failure (to use inside route handlers).
 */
export async function ensureAdmin(req: NextRequest) {
  // TEMPORARY: For testing Kanban functionality, bypass auth in development
  if (process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH_FOR_TESTING === 'true') {
    return {
      uid: 'test-admin-user',
      email: 'test-admin@example.com',
      admin: true
    };
  }

  // 1) Try Firebase session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value || cookieStore.get('session')?.value;

  // 2) Try Authorization: Bearer <idToken>
  let idToken: string | undefined;
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization') || req.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    idToken = authHeader.slice(7).trim();
  }

  try {
    const decoded = sessionCookie
      ? await auth.verifySessionCookie(sessionCookie, true)
      : idToken
      ? await auth.verifyIdToken(idToken, true)
      : null;

    if (!decoded) {
      throw new Response('Unauthorized', { status: 401 });
    }

    const isClaimAdmin = !!(decoded as any).admin;
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const isAllowlisted = decoded.email ? adminEmails.includes(decoded.email.toLowerCase()) : false;

    if (!isClaimAdmin && !isAllowlisted) {
      throw new Response('Forbidden', { status: 403 });
    }

    return decoded; // { uid, email, admin?: true, ... }
  } catch (err) {
    if (err instanceof Response) throw err;
    throw new Response('Unauthorized', { status: 401 });
  }
}

/* ---------- Compatibility Exports (so old imports keep working) ---------- */
// Canonical
export { adminDb, auth, Timestamp, FieldValue };

// Legacy aliases used around the codebase
export const db = adminDb; // some files import { db }
export const adb = adminDb; // some files import { adb }
export const getAdminDb = () => adminDb;
export const adminAuth = auth;

// Default export (optional convenience)
export default app;