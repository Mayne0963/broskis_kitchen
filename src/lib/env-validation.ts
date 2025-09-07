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

  // Firebase client configuration (NEXT_PUBLIC variables for browser access)
  const firebaseClientVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Firebase server configuration (fallback variables)
  const firebaseServerVars = {
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
  const hasFirebaseClient = Object.values(firebaseClientVars).every(v => !!v);
  const hasFirebaseServer = Object.values(firebaseServerVars).every(v => !!v);
  
  if (!hasFirebaseClient && !hasFirebaseServer) {
    warnings.push('Missing Firebase configuration: No NEXT_PUBLIC_FIREBASE_* or FIREBASE_* variables found');
  } else if (!hasFirebaseClient) {
    warnings.push('Missing NEXT_PUBLIC_FIREBASE_* variables for client-side Firebase access');
  }

  // Check individual Firebase client variables
  Object.entries(firebaseClientVars).forEach(([key, value]) => {
    if (!value) {
      warnings.push(`Missing Firebase client variable: ${key}`);
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
      hasFirebaseClient: hasFirebaseClient,
      hasFirebaseServer: hasFirebaseServer,
      hasFirebase: hasFirebaseClient || hasFirebaseServer,
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

