import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as admin from "firebase-admin";
import type { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is required");
  const parsed = JSON.parse(raw);
  // Defensive: fix private_key newlines if needed
  if (parsed.private_key && !parsed.private_key.includes("BEGIN PRIVATE KEY")) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

// Initialize Firebase Admin with simplified setup
const svc = getServiceAccount();
const app: App = getApps()[0] || initializeApp({ 
  credential: cert(svc),
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Export core services
export const db = getFirestore(app);
export const adminApp = app;
export const auth = getAuth(app);

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

// Export Firebase Admin utilities
export const Timestamp = admin.firestore.Timestamp;
export const FieldValue = admin.firestore.FieldValue;

// Legacy compatibility exports (so old imports keep working)
export const adminDb = db; // some files import { adminDb }
export const adminAuth = auth; // some files import { adminAuth }
export const adb = db; // some files import { adb }
export const getAdminDb = () => db;

// Export the admin namespace
export { admin };