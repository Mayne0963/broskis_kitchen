// Environment validation utility for client-side variables
// This helps catch missing environment variables that could cause black screens

export function validateClientEnv() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical client-side environment variables
  const requiredClientVars = {
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    'NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY': process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY,
  };

  // Firebase client configuration
  const firebaseVars = {
    'FIREBASE_API_KEY': process.env.FIREBASE_API_KEY,
    'FIREBASE_AUTH_DOMAIN': process.env.FIREBASE_AUTH_DOMAIN,
    'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
    'FIREBASE_STORAGE_BUCKET': process.env.FIREBASE_STORAGE_BUCKET,
    'FIREBASE_MESSAGING_SENDER_ID': process.env.FIREBASE_MESSAGING_SENDER_ID,
    'FIREBASE_APP_ID': process.env.FIREBASE_APP_ID,
  };

  // Check required variables
  Object.entries(requiredClientVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // Check Firebase variables (warnings only)
  Object.entries(firebaseVars).forEach(([key, value]) => {
    if (!value) {
      warnings.push(`Missing Firebase environment variable: ${key}`);
    }
  });

  // Log results
  if (errors.length > 0) {
    console.error('🚨 Critical environment variable errors:', errors);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Environment variable warnings:', warnings);
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }

  // Return validation results
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasStripe: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasRecaptcha: !!process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY,
      hasFirebase: Object.values(firebaseVars).every(v => !!v),
      timestamp: new Date().toISOString()
    }
  };
}

// Safe environment variable getter with fallbacks
export function getEnvVar(key: string, fallback: string = ''): string {
  const value = process.env[key];
  if (!value && fallback) {
    console.warn(`⚠️ Using fallback for ${key}: ${fallback}`);
  }
  return value || fallback;
}

// Client-side environment checker (runs in browser)
export function runClientEnvCheck() {
  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  console.log('🔍 Running client-side environment check...');
  
  const validation = validateClientEnv();
  
  // Store validation results for debugging
  (window as any).__ENV_VALIDATION__ = validation;
  
  if (!validation.isValid) {
    console.error('🚨 Environment validation failed! This may cause application errors.');
    console.error('Missing variables:', validation.errors);
  }

  return validation;
}

