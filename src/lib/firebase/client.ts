/**
 * Firebase client configuration for public reads
 * Used in client-side components and pages
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getValidatedClientConfig } from './env-validation';

// Initialize Firebase client app
let app;
try {
  const config = getValidatedClientConfig();
  app = getApps().length === 0 ? initializeApp(config) : getApp();
} catch (error) {
  console.error('Failed to initialize Firebase client:', error);
  throw error;
}

// Export Firebase services for client-side use
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the app instance
export default app;

// Helper function to check if Firebase is properly initialized
export const isFirebaseInitialized = () => {
  try {
    return !!app && !!auth && !!db;
  } catch {
    return false;
  }
};