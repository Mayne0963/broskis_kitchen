import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Validate and format private key
function validateAndFormatPrivateKey(privateKey: string | undefined): string {
  if (!privateKey) {
    throw new Error('FIREBASE_ADMIN_PRIVATE_KEY environment variable is required');
  }
  
  // Handle escaped newlines
  return privateKey.includes('\\n') ? privateKey.replace(/\\n/g, '\n') : privateKey;
}

// Validate required environment variables
function validateFirebaseConfig() {
  const requiredVars = {
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase Admin environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env.local file and ensure all Firebase Admin SDK credentials are properly configured.'
    );
  }

  return {
    projectId: requiredVars.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: requiredVars.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: validateAndFormatPrivateKey(requiredVars.FIREBASE_ADMIN_PRIVATE_KEY)
  };
}

export function ensureAdmin() {
  // Only initialize if no apps exist
  if (getApps().length > 0) {
    return;
  }

  // Skip initialization during build time if no credentials are available
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasIndividualVars = process.env.FIREBASE_ADMIN_PROJECT_ID && 
                           process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
                           process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  
  if (!serviceAccountJson && !hasIndividualVars) {
    console.warn('⚠️ Firebase Admin SDK credentials not found. Skipping initialization.');
    return;
  }

  try {
    // Check for FIREBASE_SERVICE_ACCOUNT first (JSON format)
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        // Validate required fields in service account
        if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
          throw new Error('Service account JSON is missing required fields (private_key, client_email, project_id)');
        }
        
        // Fix private key formatting
        if (serviceAccount.private_key.includes('\\n')) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        
        initializeApp({
          credential: cert(serviceAccount)
        });
        
        console.log('✅ Firebase Admin SDK initialized successfully with service account JSON');
        return;
      } catch (parseError) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', parseError);
        throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${parseError}`);
      }
    }
    
    // Fallback to individual environment variables
    const config = validateFirebaseConfig();
    
    initializeApp({
      credential: cert(config)
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully with individual environment variables');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Initialize admin app
ensureAdmin();

// Get the initialized app (if available)
function getAdminApp() {
  const apps = getApps();
  if (apps.length === 0) {
    throw new Error('Firebase Admin SDK not initialized. Please check your credentials.');
  }
  return apps[0];
}

// Export database and auth instances with lazy initialization
export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

// Export database and auth instances for backward compatibility
// These will throw an error if Firebase is not properly initialized
export const adb = (() => {
  try {
    return getAdminDb();
  } catch {
    return null as any; // Return null during build time
  }
})();

export const db = adb; // alias for compatibility

export const adminAuth = (() => {
  try {
    return getAdminAuth();
  } catch {
    return null as any; // Return null during build time
  }
})();

export const auth = adminAuth; // alias for compatibility