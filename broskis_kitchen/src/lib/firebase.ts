// Firebase configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'RECAPTCHA_V3_SITE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('Missing Firebase environment variables:', missingVars);
    return false;
  }

  return true;
};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
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
    
    // Initialize App Check for client-side only
    if (typeof window !== 'undefined' && process.env.RECAPTCHA_V3_SITE_KEY) {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(process.env.RECAPTCHA_V3_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
        console.log('Firebase App Check initialized successfully');
      } catch (error) {
        console.warn('Firebase App Check initialization failed:', error);
      }
    }
    
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
export const storage =
  isFirebaseConfigured && app ? getStorage(app) : null;
export const adminStorage =
  isFirebaseConfigured &&
  app &&
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET
    ? getStorage(app, process.env.FIREBASE_ADMIN_STORAGE_BUCKET)
    : storage;

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
    projectId: process.env.FIREBASE_PROJECT_ID || 'Not configured'
  };
};

export default app;