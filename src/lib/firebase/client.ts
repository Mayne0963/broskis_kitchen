"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, setLogLevel } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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

// Initialize Firebase services
// Use initializeFirestore with long polling to avoid WebChannel/CORS issues
export const db = firebaseClientApp
  ? initializeFirestore(firebaseClientApp, {
      // Force long polling to work reliably behind proxies, firewalls, and in Safari/iOS
      experimentalForceLongPolling: true,
      // Auto-detect long polling when appropriate
      experimentalAutoDetectLongPolling: true as any, // type-safe for SDK variations
      // Disable fetch streams to avoid CORS preflight/stream issues
      useFetchStreams: false,
    })
  : null;
export const auth = firebaseClientApp ? getAuth(firebaseClientApp) : null;
export const storage = firebaseClientApp ? getStorage(firebaseClientApp) : null;

// Reduce Firestore log noise but keep errors visible
if (typeof window !== 'undefined') {
  try {
    setLogLevel('error');
  } catch {}
}

// Export app and configuration status
export const app = firebaseClientApp;
export { isFirebaseConfigured };

// Helper functions for compatibility
export const isFirebaseAvailable = () => isFirebaseConfigured && firebaseClientApp !== null;
export const isFirebaseReady = () => isFirebaseConfigured && db !== null && auth !== null;