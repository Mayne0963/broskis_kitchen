import "server-only";
import * as admin from "firebase-admin";

const app =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });

export const adminApp = app;
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export { admin };