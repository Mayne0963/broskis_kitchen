import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Validate required environment variables only on client side
const validateFirebaseConfig = () => {
  // Skip validation during build time (server-side)
  if (typeof window === 'undefined') {
    return false;
  }
  
  const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('Missing Firebase environment variables:', missingVars);
    return false;
  }
  return true;
};

// Firebase configuration with fallbacks for build time
const c = {
  apiKey: process.env.FIREBASE_API_KEY || 'build-time-placeholder',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'build-time-placeholder',
  projectId: process.env.FIREBASE_PROJECT_ID || 'build-time-placeholder',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'build-time-placeholder'
};

let app, auth, db;
let isConfigured = false;

try {
  // Only initialize Firebase if we're on the client side and config is valid
  if (typeof window !== 'undefined') {
    if (!validateFirebaseConfig()) {
      console.warn('Firebase configuration incomplete - running in fallback mode');
      isConfigured = false;
    } else {
      app = getApps()[0] || initializeApp(c);
      auth = getAuth(app);
      db = getFirestore(app);
      isConfigured = true;
    }
  } else {
    // During build time, create placeholder app to prevent errors
    app = getApps()[0] || initializeApp(c);
    auth = getAuth(app);
    db = getFirestore(app);
    isConfigured = false; // Mark as not configured for build time
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  isConfigured = false;
}

// Export Firebase instances with configuration status
export { app, auth, db, isConfigured };

// Storage initialization with proper error handling
export let storage, adminStorage;

try {
  if (app && isConfigured) {
    const uploadsBucket =
      process.env.FIREBASE_STORAGE_BUCKET_UPLOADS || c.storageBucket;
    storage = getStorage(app, uploadsBucket);
    adminStorage = getStorage(
      app,
      process.env.FIREBASE_ADMIN_STORAGE_BUCKET || uploadsBucket
    );
  } else {
    // Provide null values during build time or when not configured
    storage = null;
    adminStorage = null;
  }
} catch (error) {
  console.error('Failed to initialize Firebase Storage:', error);
  storage = null;
  adminStorage = null;
}

// Helper function to check if Firebase is ready for use
export const isFirebaseReady = () => {
  return typeof window !== 'undefined' && isConfigured && app && auth && db;
};