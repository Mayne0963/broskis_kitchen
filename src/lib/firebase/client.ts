import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Default Firebase configuration - prevents initialization errors
const defaultFirebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

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

  // Check for regular variables (fallback)
  const serverConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };

  // Use client config if available, otherwise server config, otherwise default
  const config = {
    apiKey: clientConfig.apiKey || serverConfig.apiKey || defaultFirebaseConfig.apiKey,
    authDomain: clientConfig.authDomain || serverConfig.authDomain || defaultFirebaseConfig.authDomain,
    projectId: clientConfig.projectId || serverConfig.projectId || defaultFirebaseConfig.projectId,
    storageBucket: clientConfig.storageBucket || serverConfig.storageBucket || defaultFirebaseConfig.storageBucket,
    messagingSenderId: clientConfig.messagingSenderId || serverConfig.messagingSenderId || defaultFirebaseConfig.messagingSenderId,
    appId: clientConfig.appId || serverConfig.appId || defaultFirebaseConfig.appId
  };

  const isRealConfig = Object.values(clientConfig).some(value => value) || Object.values(serverConfig).some(value => value);
  
  return { config, isRealConfig };
}

let firebaseClientApp = null;
let db = null;
let isFirebaseEnabled = false;

try {
  const { config, isRealConfig } = getFirebaseConfig();
  
  // Always initialize Firebase to prevent app crashes
  firebaseClientApp = getApps().length ? getApp() : initializeApp(config);
  
  if (isRealConfig) {
    db = getFirestore(firebaseClientApp);
    isFirebaseEnabled = true;
    console.log('✅ Firebase client initialized with real configuration');
  } else {
    // Use demo mode - Firebase initialized but features disabled
    console.log('⚠️ Firebase running in demo mode - features disabled');
    console.log('To enable Firebase features, add NEXT_PUBLIC_FIREBASE_* environment variables');
  }
} catch (error) {
  console.warn('⚠️ Firebase initialization failed, using fallback mode:', error);
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