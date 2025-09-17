import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';



// Try to get Firebase configuration from environment variables
function getFirebaseConfig() {
  // Check for NEXT_PUBLIC variables (client-side)
  const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // Check if all required config values are present
  const isRealConfig = Object.values(clientConfig).every(value => value && value.trim() !== '');
  
  if (!isRealConfig) {
    throw new Error('Firebase configuration missing - please set NEXT_PUBLIC_FIREBASE_* environment variables');
  }

  const config = {
    apiKey: clientConfig.apiKey!,
    authDomain: clientConfig.authDomain!,
    projectId: clientConfig.projectId!,
    storageBucket: clientConfig.storageBucket!,
    messagingSenderId: clientConfig.messagingSenderId!,
    appId: clientConfig.appId!
  };

  return { config, isRealConfig: true };
}

let firebaseClientApp = null;
let db = null;
let isFirebaseEnabled = false;

try {
  const { config } = getFirebaseConfig();
  
  // Initialize Firebase with real configuration
  firebaseClientApp = getApps().length ? getApp() : initializeApp(config);
  db = getFirestore(firebaseClientApp);
  isFirebaseEnabled = true;
  console.log('✅ Firebase client initialized successfully');
} catch (error) {
  console.warn('⚠️ Firebase initialization failed:', error.message);
  console.warn('Please ensure all NEXT_PUBLIC_FIREBASE_* environment variables are set');
  firebaseClientApp = null;
  db = null;
  isFirebaseEnabled = false;
}

// Safe Firebase operations that won't crash the app
export const safeFirebaseOp = (operation: () => any, fallback: any = null) => {
  if (!isFirebaseEnabled || !db) {
    console.warn('Firebase operation skipped - Firebase not properly configured');
    return Promise.resolve(fallback);
  }
  
  try {
    return operation();
  } catch (error) {
    console.warn('Firebase operation failed:', error);
    return Promise.resolve(fallback);
  }
};

export { firebaseClientApp, db, isFirebaseEnabled };