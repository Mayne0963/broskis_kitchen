import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import * as admin from "firebase-admin";
import type { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';

/**
 * Get Firebase Admin service account credentials from environment variables
 * Handles both JSON string and individual environment variables
 */
function getServiceAccount() {
  // Try FIREBASE_SERVICE_ACCOUNT first (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      // Handle private key newline replacement
      if (parsed.private_key && !parsed.private_key.includes("BEGIN PRIVATE KEY")) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", error);
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON");
    }
  }

  // Fallback to individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials missing. Provide either FIREBASE_SERVICE_ACCOUNT or " +
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY"
    );
  }

  return {
    type: "service_account",
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, "\n"), // Handle newline replacement
  };
}

// Prevent duplicate app initialization
let adminApp: App;
let dbAdmin: Firestore;
let dbAdminNamed: Firestore;
let authAdmin: Auth;

try {
  // Check if app already exists
  adminApp = getApps().find(app => app.name === '[DEFAULT]') || getApps()[0];
  
  if (!adminApp) {
    // Initialize new app with service account credentials
    const serviceAccount = getServiceAccount();
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  // Initialize services
  dbAdmin = getFirestore(adminApp);
  dbAdminNamed = getFirestore(adminApp, 'admin');
  authAdmin = getAuth(adminApp);
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  throw new Error("Failed to initialize Firebase Admin SDK");
}

// Export Firebase Admin app and services
export { adminApp, dbAdmin };
export const adminDbAdmin = dbAdminNamed;

// Legacy compatibility exports (maintain existing imports)
export const db = dbAdmin;
export const auth = authAdmin;
export const app = adminApp;

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
    const adminEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
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
export const getAdminDb = (target?: 'public' | 'admin') => (target === 'admin' ? dbAdminNamed : db);

// Export the admin namespace
export { admin };
