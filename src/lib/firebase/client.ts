"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

function getEnv(name: string, fallback?: string) {
  return process.env[name] || fallback || "";
}

// Prefer NEXT_PUBLIC_*; fallback to non-prefixed if present
const config = {
  apiKey: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY", process.env.FIREBASE_API_KEY),
  authDomain: getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.FIREBASE_AUTH_DOMAIN),
  projectId: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", process.env.FIREBASE_PROJECT_ID),
  storageBucket: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", process.env.FIREBASE_STORAGE_BUCKET),
  messagingSenderId: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", process.env.FIREBASE_MESSAGING_SENDER_ID),
  appId: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID", process.env.FIREBASE_APP_ID),
};

// Check if configuration is complete
const isFirebaseConfigured = Object.values(config).every(v => v && v.trim() !== '');

if (!isFirebaseConfigured) {
  // Soft warn in dev; stay silent in prod
  if (process.env.NODE_ENV !== "production") {
    console.warn("Firebase client config incomplete", config);
  }
}

// Initialize Firebase app
export const firebaseClientApp = isFirebaseConfigured 
  ? (getApps().length ? getApp() : initializeApp(config))
  : null;

// Initialize Firebase services (use a single Firestore instance across app)
// Guard against initialization errors in test/mocked environments
export const db = (() => {
  try {
    return firebaseClientApp ? getFirestore(firebaseClientApp) : null;
  } catch {
    return null;
  }
})();

export const auth = (() => {
  try {
    return firebaseClientApp ? getAuth(firebaseClientApp) : null;
  } catch {
    return null;
  }
})();

export const storage = (() => {
  try {
    return firebaseClientApp ? getStorage(firebaseClientApp) : null;
  } catch {
    return null;
  }
})();

// Reduce Firestore log noise but keep errors visible
if (typeof window !== 'undefined') {
  try {
    setLogLevel('error');
  } catch {}
}

// Initialize App Check when configured
if (typeof window !== 'undefined' && firebaseClientApp) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY || process.env.RECAPTCHA_V3_SITE_KEY;
  if (siteKey) {
    try {
      initializeAppCheck(firebaseClientApp, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.warn('[AppCheck] init failed:', err);
    }
  }
}

// Export app and configuration status
export const app = firebaseClientApp;
export { isFirebaseConfigured };

// Helper functions for compatibility
export const isFirebaseAvailable = () => isFirebaseConfigured && firebaseClientApp !== null;
export const isFirebaseReady = () => isFirebaseConfigured && db !== null && auth !== null;