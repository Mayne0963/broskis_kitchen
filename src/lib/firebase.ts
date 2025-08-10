// Firebase configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing Firebase environment variables:', missingVars);
    return false;
  }

  return true;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase - prevent duplicate app error
let app;
let isFirebaseConfigured = false;

try {
  // First validate configuration
  if (!validateFirebaseConfig()) {
    console.warn('Firebase configuration is incomplete. Using fallback mode.');
    isFirebaseConfigured = false;
  } else {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    isFirebaseConfigured = true;
    console.log('Firebase initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  isFirebaseConfigured = false;
}

// Initialize Firebase services with error handling
export const db = isFirebaseConfigured && app ? getFirestore(app) : null;
export const auth = isFirebaseConfigured && app ? getAuth(app) : null;

// Export configuration status
export { isFirebaseConfigured };

// Helper function to check if Firebase is ready
export const isFirebaseReady = () => {
  return isFirebaseConfigured && db !== null && auth !== null;
};

// Helper function to get Firebase status for debugging
export const getFirebaseStatus = () => {
  return {
    configured: isFirebaseConfigured,
    hasDb: db !== null,
    hasAuth: auth !== null,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not configured'
  };
};

export default app;