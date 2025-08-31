export const env = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID!,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\n/g, '\n'),
};

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

// Validate Firebase Admin variables (either FIREBASE_* or FIREBASE_ADMIN_* format)
const adminVars = [
  { primary: 'FIREBASE_PROJECT_ID', fallback: 'FIREBASE_ADMIN_PROJECT_ID' },
  { primary: 'FIREBASE_CLIENT_EMAIL', fallback: 'FIREBASE_ADMIN_CLIENT_EMAIL' },
  { primary: 'FIREBASE_PRIVATE_KEY', fallback: 'FIREBASE_ADMIN_PRIVATE_KEY' },
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

for (const { primary, fallback } of adminVars) {
  if (!process.env[primary] && !process.env[fallback]) {
    throw new Error(`Missing Firebase Admin env vars: ${primary}, ${fallback}`);
  }
}