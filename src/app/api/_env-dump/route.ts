import { NextResponse } from 'next/server';

export async function GET() {
  // Helper function to mask secrets
  const maskSecret = (value: string | undefined): string => {
    if (!value) return 'undefined';
    if (value.length <= 4) return value;
    return value.substring(0, 4) + '***';
  };

  // Helper function to get env value safely
  const getEnvValue = (key: string, isSecret = false): string => {
    const value = process.env[key];
    if (!value) return 'undefined';
    return isSecret ? maskSecret(value) : value;
  };

  const envData = {
    // RECAPTCHA variables (focus area)
    RECAPTCHA_V3_SITE_KEY: getEnvValue('RECAPTCHA_V3_SITE_KEY'),
    NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY: getEnvValue('NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY'),
    RECAPTCHA_V3_SECRET_KEY: getEnvValue('RECAPTCHA_V3_SECRET_KEY', true),
    
    // Other common variables that might have issues
    GOOGLE_MAPS_API_KEY: getEnvValue('GOOGLE_MAPS_API_KEY', true),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: getEnvValue('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'),
    
    // Firebase variables
    FIREBASE_API_KEY: getEnvValue('FIREBASE_API_KEY'),
    NEXT_PUBLIC_FIREBASE_API_KEY: getEnvValue('NEXT_PUBLIC_FIREBASE_API_KEY'),
    FIREBASE_PROJECT_ID: getEnvValue('FIREBASE_PROJECT_ID'),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: getEnvValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    
    // Stripe variables
    STRIPE_PUBLISHABLE_KEY: getEnvValue('STRIPE_PUBLISHABLE_KEY'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: getEnvValue('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    STRIPE_SECRET_KEY: getEnvValue('STRIPE_SECRET_KEY', true),
    
    // Age verification
    AGE_VERIFICATION_EXPIRY_DAYS: getEnvValue('AGE_VERIFICATION_EXPIRY_DAYS'),
    NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS: getEnvValue('NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS'),
    
    // Admin and auth
    BK_ADMIN_CODE: getEnvValue('BK_ADMIN_CODE', true),
    NEXTAUTH_SECRET: getEnvValue('NEXTAUTH_SECRET', true),
    
    // Environment info
    NODE_ENV: getEnvValue('NODE_ENV'),
    VERCEL_ENV: getEnvValue('VERCEL_ENV'),
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    variables: envData,
    note: 'Secrets are masked with first 4 chars + ***'
  });
}