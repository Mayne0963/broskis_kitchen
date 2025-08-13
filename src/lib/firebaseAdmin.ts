import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID!;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL!;
const PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const DEFAULT_BUCKET = process.env.FIREBASE_STORAGE_BUCKET
  || process.env.FIREBASE_ADMIN_STORAGE_BUCKET
  || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const UPLOADS_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_UPLOADS || DEFAULT_BUCKET;

if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  throw new Error('Missing required Firebase Admin ENV vars.');
}

const app = getApps().length ? getApp() : initializeApp({
  credential: cert({ projectId: PROJECT_ID, clientEmail: CLIENT_EMAIL, privateKey: PRIVATE_KEY }),
  storageBucket: DEFAULT_BUCKET
});

export const db = getFirestore(app);
export const adb = db;
export const auth = getAuth(app);
export const adminAuth = auth;
export const adminBucket = getStorage(app).bucket(UPLOADS_BUCKET || DEFAULT_BUCKET);

export function getAdminBucket(name?: string) {
  const bucketName = name || UPLOADS_BUCKET || DEFAULT_BUCKET;
  if (!bucketName) throw new Error('Set FIREBASE_STORAGE_BUCKET to your default bucket.');
  return getStorage(app).bucket(bucketName);
}