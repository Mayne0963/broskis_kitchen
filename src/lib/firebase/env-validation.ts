/**
 * Environment variable validation for Firebase configuration
 * Ensures all required Firebase environment variables are present
 */

const requiredClientEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
] as const;

const requiredServerEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
] as const;

/**
 * Validates client-side Firebase environment variables
 * @throws Error if any required variables are missing
 */
export function validateClientFirebaseEnv(): void {
  const missingVars = requiredClientEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase client environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env.local file and ensure all FIREBASE_* variables are set.'
    );
  }
}

/**
 * Validates server-side Firebase Admin SDK environment variables
 * @throws Error if any required variables are missing
 */
export function validateServerFirebaseEnv(): void {
  const missingVars = requiredServerEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase server environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env.local file and ensure all Firebase Admin SDK variables are set.'
    );
  }

  // Validate private key format
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey && !privateKey.includes('\\n')) {
    console.warn(
      'FIREBASE_PRIVATE_KEY may not have proper newline escaping. ' +
      'Ensure newlines are escaped as \\n in your environment file.'
    );
  }
}

/**
 * Gets validated Firebase client configuration
 * @returns Firebase client config object
 */
export function getValidatedClientConfig() {
  validateClientFirebaseEnv();
  
  return {
    apiKey: process.env.FIREBASE_API_KEY!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.FIREBASE_PROJECT_ID!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.FIREBASE_APP_ID!
  };
}

/**
 * Gets validated Firebase Admin SDK configuration
 * @returns Firebase Admin SDK config object
 */
export function getValidatedAdminConfig() {
  validateServerFirebaseEnv();
  
  return {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
  };
}