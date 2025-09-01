// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only validate environment variables on the client side
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  
  // During build time or server-side rendering, return placeholder values
  if (!isBrowser && !value && required) {
    return `placeholder-${name.toLowerCase()}`;
  }
  
  // On the client side, validate required variables
  if (isBrowser && !value && required) {
    console.warn(`Missing required environment variable: ${name}`);
    return '';
  }
  
  return value || '';
}

export const env = {
  FIREBASE_API_KEY: getEnvVar('FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  FIREBASE_PROJECT_ID: getEnvVar('FIREBASE_PROJECT_ID'),
  FIREBASE_STORAGE_BUCKET: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  FIREBASE_MESSAGING_SENDER_ID: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  FIREBASE_APP_ID: getEnvVar('FIREBASE_APP_ID'),
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\n/g, '\n'),
};

// Only validate on the client side
if (isBrowser) {
  const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Missing required environment variable: ${envVar}`);
    }
  }
}