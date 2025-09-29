import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error("FIREBASE_SERVICE_ACCOUNT is required");
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(svc)),
  });
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };