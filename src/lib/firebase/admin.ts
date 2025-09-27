import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const svc = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

export const firebaseApp =
  getApps()[0] ||
  initializeApp(svc ? { credential: cert(svc) } : undefined);

export const fdb = getFirestore(firebaseApp);