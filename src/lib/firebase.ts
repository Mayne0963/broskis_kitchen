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
    'FIREBASE_APP_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => {
    const value = process.env[varName];
    if (!value) {
      console.warn(`⚠️ Missing Firebase environment variable: ${varName}`);
      return true;
    }
    return false;
  });
  
  if (missingVars.length > 0) {
    console.error('🚨 Firebase configuration incomplete. Missing variables:', missingVars);
    console.error('🔧 Please add these environment variables to Vercel:');
    missingVars.forEach(varName => {
      console.error(`   ${varName}=your_${varName.toLowerCase()}_value`);
    });
    return false;
  }

  console.log('✅ Firebase configuration validation passed');
  return true;
};

// Safe Firebase configuration with fallbacks
const createFirebaseConfig = () => {
  return {
    apiKey: process.env.FIREBASE_API_KEY || 'missing-api-key',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'missing-auth-domain',
    projectId: process.env.FIREBASE_PROJECT_ID || 'missing-project-id',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'missing-storage-bucket',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || 'missing-sender-id',
    appId: process.env.FIREBASE_APP_ID || 'missing-app-id'
  };
};

// Initialize Firebase - prevent duplicate app error
let app;
let isFirebaseConfigured = false;
let firebaseError = null;

try {
  // First validate configuration
  isFirebaseConfigured = validateFirebaseConfig();
  
  if (!isFirebaseConfigured) {
    console.warn('🚨 Firebase initialization skipped due to missing environment variables');
    console.warn('🔧 App will run in Firebase-disabled mode');
    firebaseError = new Error('Firebase configuration incomplete - missing environment variables');
  } else {
    const firebaseConfig = createFirebaseConfig();
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize App Check for client-side only
    if (typeof window !== 'undefined' && process.env.RECAPTCHA_V3_SITE_KEY) {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(process.env.RECAPTCHA_V3_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
        console.log('✅ Firebase App Check initialized successfully');
      } catch (error) {
        console.warn('⚠️ Firebase App Check initialization failed:', error);
      }
    } else {
      console.warn('⚠️ Firebase App Check skipped - missing RECAPTCHA_V3_SITE_KEY');
    }
    
    console.log('✅ Firebase initialized successfully');
  }
} catch (error) {
  console.error('🚨 Firebase initialization failed:', error);
  isFirebaseConfigured = false;
  firebaseError = error;
}

// Safe Firebase service getters with error handling
const getFirebaseService = (serviceName: string, serviceGetter: () => any) => {
  if (!isFirebaseConfigured || !app) {
    console.warn(`⚠️ ${serviceName} not available - Firebase not configured`);
    return null;
  }
  
  try {
    return serviceGetter();
  } catch (error) {
    console.error(`🚨 Failed to get ${serviceName}:`, error);
    return null;
  }
};

// Initialize Firebase services with error handling
export const db = getFirebaseService('Firestore', () => getFirestore(app));
export const auth = getFirebaseService('Auth', () => getAuth(app));
export const storage = getFirebaseService('Storage', () => getStorage(app));
export const adminStorage = getFirebaseService('Admin Storage', () => 
  process.env.FIREBASE_ADMIN_STORAGE_BUCKET 
    ? getStorage(app, process.env.FIREBASE_ADMIN_STORAGE_BUCKET)
    : storage
);

// Export Firebase app and configuration status
export { app };
export const isConfigured = isFirebaseConfigured;
export const configError = firebaseError;

// Helper function to check if Firebase is available
export const isFirebaseAvailable = () => {
  return isFirebaseConfigured && app !== null;
};

// Helper function to get Firebase status for debugging
export const getFirebaseStatus = () => {
  return {
    configured: isFirebaseConfigured,
    hasApp: !!app,
    hasDb: !!db,
    hasAuth: !!auth,
    hasStorage: !!storage,
    error: firebaseError?.message || null,
    timestamp: new Date().toISOString(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'Not configured'
  };
};

// Export configuration status
export { isFirebaseConfigured };

// Helper function to check if Firebase is ready
export const isFirebaseReady = () => {
  return isFirebaseConfigured && db !== null && auth !== null;
};

export default app;