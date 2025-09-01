import { cert, getApps, initializeApp } from 'firebase-admin/app';

let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');

export function getAdminApp() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey
      })
    });
  }
}