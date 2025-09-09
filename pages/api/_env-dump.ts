import { NextApiRequest, NextApiResponse } from 'next';

function maskSecret(value: string | undefined): string {
  if (!value) return 'undefined';
  if (value.length <= 4) return value;
  return value.substring(0, 4) + '***';
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Collect environment variables
  const envVars = {
    // RECAPTCHA variables
    RECAPTCHA_V3_SITE_KEY: process.env.RECAPTCHA_V3_SITE_KEY || 'undefined',
    NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY || 'undefined',
    RECAPTCHA_V3_SECRET_KEY: maskSecret(process.env.RECAPTCHA_V3_SECRET_KEY),
    NEXT_PUBLIC_RECAPTCHA_V3_SECRET_KEY: maskSecret(process.env.NEXT_PUBLIC_RECAPTCHA_V3_SECRET_KEY),
    
    // Firebase variables
    FIREBASE_API_KEY: maskSecret(process.env.FIREBASE_API_KEY),
    NEXT_PUBLIC_FIREBASE_API_KEY: maskSecret(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || 'undefined',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'undefined',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'undefined',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'undefined',
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'undefined',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'undefined',
    
    // Stripe variables
    STRIPE_SECRET_KEY: maskSecret(process.env.STRIPE_SECRET_KEY),
    STRIPE_PUBLISHABLE_KEY: maskSecret(process.env.STRIPE_PUBLISHABLE_KEY),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: maskSecret(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    
    // Google Maps
    GOOGLE_MAPS_API_KEY: maskSecret(process.env.GOOGLE_MAPS_API_KEY),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: maskSecret(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
    
    // Age verification
    AGE_VERIFICATION_EXPIRY_DAYS: process.env.AGE_VERIFICATION_EXPIRY_DAYS || 'undefined',
    NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS: process.env.NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS || 'undefined',
    
    // Environment info
    NODE_ENV: process.env.NODE_ENV || 'undefined',
    VERCEL_ENV: process.env.VERCEL_ENV || 'undefined'
  };

  const response = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    variables: envVars,
    note: 'Secrets are masked with first 4 characters + ***'
  };

  res.status(200).json(response);
}