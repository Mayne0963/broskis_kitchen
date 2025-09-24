import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

let adminApp: App | null = null;

export function initializeFirebaseAdmin(): App {
  // Return existing app if already initialized
  if (adminApp) {
    return adminApp;
  }

  // Check if any Firebase Admin apps are already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Initialize new Firebase Admin app
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    // Validate required environment variables
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Missing required Firebase Admin environment variables');
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId
    });

    console.log('Firebase Admin initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export function getFirebaseAdmin(): App {
  if (!adminApp) {
    return initializeFirebaseAdmin();
  }
  return adminApp;
}