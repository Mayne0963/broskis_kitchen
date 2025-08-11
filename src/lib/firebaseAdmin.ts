import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const storageBucket =
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
const uploadsBucket =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_UPLOADS || storageBucket;

const app = getApps()[0] ||
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
    }),
    storageBucket
  });

export const adb = getFirestore(app);
export const adminBucket = getStorage(app, uploadsBucket).bucket();