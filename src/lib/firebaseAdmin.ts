import "server-only";
import { getApps, getApp, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Support both:
 * 1) FIREBASE_SERVICE_ACCOUNT = JSON string with { project_id, client_email, private_key }
 * 2) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (with \n escaped)
 */
function loadServiceAccount() {
  let svc = process.env.FIREBASE_SERVICE_ACCOUNT;

  // If present, try to parse as JSON first
  if (svc) {
    // strip accidental wrapping quotes/backticks/whitespace
    svc = svc.trim();
    if ((svc.startsWith("'") && svc.endsWith("'")) || (svc.startsWith('"') && svc.endsWith('"')) || (svc.startsWith("`") && svc.endsWith("`"))) {
      svc = svc.slice(1, -1);
    }
    try {
      const parsed = JSON.parse(svc);
      if (typeof parsed.private_key !== "string" || !parsed.private_key) {
        throw new Error("Service account object must contain a string private_key property");
      }
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      return parsed;
    } catch {
      // maybe it's base64
      try {
        const decoded = Buffer.from(svc, "base64").toString("utf8");
        const parsed = JSON.parse(decoded);
        parsed.private_key = (parsed.private_key || "").replace(/\\n/g, "\n");
        return parsed;
      } catch (e2) {
        console.error("FIREBASE_SERVICE_ACCOUNT is not valid JSON or base64 JSON.");
        throw e2;
      }
    }
  }

  // Fallback to split envs
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials missing. Provide FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.");
  }
  return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
}

// Singleton
let app: App;
if (getApps().length) {
  app = getApp();
} else {
  const svc = loadServiceAccount();
  app = initializeApp({
    credential: cert({
      projectId: svc.project_id,
      clientEmail: svc.client_email,
      privateKey: svc.private_key,
    }),
  });
}

// Canonical admin instances
const adminAuth: Auth = getAuth(app);
const adminDb: Firestore = getFirestore(app);

// ---- Exports to satisfy legacy imports across the codebase ----
// Canonical
export { adminAuth, adminDb };
// Legacy aliases (many files expect these)
export const auth = adminAuth;
export const db = adminDb;
export const adb = adminDb; // some files import { adb } for "admin db"
export const getAdminAuth = () => adminAuth;
export const getAdminDb = () => adminDb;
export const firebaseAdminApp = app;

// Ensure admin app is initialized
export function ensureAdmin() {
  return firebaseAdminApp;
}