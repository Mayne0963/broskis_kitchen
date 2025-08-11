import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const c = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!
};

export const app = getApps()[0] || initializeApp(c);
export const db = getFirestore(app);
const uploadsBucket =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_UPLOADS || c.storageBucket;
export const storage = getStorage(app, uploadsBucket);
export const adminStorage = getStorage(
  app,
  process.env.NEXT_PUBLIC_FIREBASE_ADMIN_STORAGE_BUCKET || uploadsBucket
);