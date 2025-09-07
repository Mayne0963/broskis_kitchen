import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase client configuration - uses NEXT_PUBLIC variables for client-side access
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || ''
};

// Check if Firebase configuration is valid
const isFirebaseConfigValid = Object.values(firebaseConfig).every(value => value !== '');

let firebaseClientApp = null;
let db = null;

if (isFirebaseConfigValid) {
  try {
    firebaseClientApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(firebaseClientApp);
    console.log('✅ Firebase client initialized successfully');
  } catch (error) {
    console.warn('⚠️ Firebase client initialization failed:', error);
    firebaseClientApp = null;
    db = null;
  }
} else {
  console.warn('⚠️ Firebase client configuration incomplete - Firebase features will be disabled');
  console.warn('Missing Firebase environment variables:', 
    Object.entries(firebaseConfig)
      .filter(([key, value]) => value === '')
      .map(([key]) => key)
  );
}

export { firebaseClientApp, db };