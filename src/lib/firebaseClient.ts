import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN', 
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing Firebase environment variables:', missingVars);
  throw new Error(`Missing Firebase environment variables: ${missingVars.join(', ')}`);
}

const c = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET!
};

let app, auth, db;

try {
  app = getApps()[0] || initializeApp(c);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw error;
}

export { app, auth, db };
const uploadsBucket =
  process.env.FIREBASE_STORAGE_BUCKET_UPLOADS || c.storageBucket;
export const storage = getStorage(app, uploadsBucket);
export const adminStorage = getStorage(
  app,
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET || uploadsBucket
);