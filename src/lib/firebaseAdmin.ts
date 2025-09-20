// server-only Firebase Admin singleton
import "server-only";
import { getApps, initializeApp, cert, applicationDefault, App } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let app: App;

function init() {
  if (getApps().length) return getApps()[0];

  // Prefer FIREBASE_SERVICE_ACCOUNT (JSON string). Fallback to ADC.
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    let creds: ServiceAccount;
    try {
      creds = JSON.parse(raw);
      // Fix escaped \n in private_key if necessary
      if (creds.private_key?.includes("\\n")) {
        creds.private_key = creds.private_key.replace(/\\n/g, "\n");
      }
    } catch (e) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON.");
    }
    return initializeApp({ credential: cert(creds) });
  }
  // Local/dev fallback
  return initializeApp({ credential: applicationDefault() });
}

app = init();

export const adminApp = app;
export const adminDb = getFirestore(app);
export const auth = getAuth(app);
export { Timestamp, FieldValue };