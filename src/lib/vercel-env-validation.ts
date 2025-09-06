/**
 * Vercel-specific environment variable validation
 * Ensures all required environment variables are present for Vercel deployment
 */

export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  errors: string[];
}

// Required environment variables for Vercel deployment
const REQUIRED_VERCEL_ENV_VARS = {
  // Next.js and Authentication
  NEXTAUTH_SECRET: 'NextAuth.js secret key for JWT encryption',
  NEXTAUTH_URL: 'Canonical URL of your site for NextAuth.js',
  
  // Firebase Configuration
  FIREBASE_API_KEY: 'Firebase Web API key',
  FIREBASE_AUTH_DOMAIN: 'Firebase Auth domain',
  FIREBASE_PROJECT_ID: 'Firebase project ID',
  FIREBASE_STORAGE_BUCKET: 'Firebase storage bucket',
  FIREBASE_MESSAGING_SENDER_ID: 'Firebase messaging sender ID',
  FIREBASE_APP_ID: 'Firebase app ID',
  
  // Firebase Admin SDK (Server-side)
  FIREBASE_ADMIN_PROJECT_ID: 'Firebase Admin project ID',
  FIREBASE_ADMIN_CLIENT_EMAIL: 'Firebase Admin client email',
  FIREBASE_ADMIN_PRIVATE_KEY: 'Firebase Admin private key',
  
  // Stripe Payment Processing
  STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key for client-side',
  STRIPE_SECRET_KEY: 'Stripe secret key for server-side',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook endpoint secret',
  
  // reCAPTCHA
  RECAPTCHA_V3_SITE_KEY: 'Google reCAPTCHA v3 site key',
  RECAPTCHA_V3_SECRET_KEY: 'Google reCAPTCHA v3 secret key'
};

// Optional but recommended environment variables
const OPTIONAL_VERCEL_ENV_VARS = {
  VERCEL_URL: 'Vercel deployment URL (auto-generated)',
  VERCEL_ENV: 'Vercel environment (development, preview, production)',
  VERCEL_REGION: 'Vercel deployment region',
  NODE_ENV: 'Node.js environment'
};

/**
 * Validates all environment variables required for Vercel deployment
 */
export function validateVercelEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check required variables
  Object.keys(REQUIRED_VERCEL_ENV_VARS).forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else {
      // Additional validation for specific variables
      validateSpecificVariable(varName, value, warnings, errors);
    }
  });
  
  // Check optional variables and add warnings if missing
  Object.keys(OPTIONAL_VERCEL_ENV_VARS).forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`Optional variable ${varName} is not set`);
    }
  });
  
  // Vercel-specific validations
  validateVercelSpecificRules(warnings, errors);
  
  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    warnings,
    errors
  };
}

/**
 * Validates specific environment variable formats and values
 */
function validateSpecificVariable(
  varName: string, 
  value: string, 
  warnings: string[], 
  errors: string[]
): void {
  switch (varName) {
    case 'NEXTAUTH_SECRET':
      if (value.length < 32) {
        errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
      }
      break;
      
    case 'NEXTAUTH_URL':
      if (!value.startsWith('http')) {
        errors.push('NEXTAUTH_URL must be a valid URL starting with http:// or https://');
      }
      if (process.env.VERCEL_ENV === 'production' && !value.startsWith('https://')) {
        warnings.push('NEXTAUTH_URL should use HTTPS in production');
      }
      break;
      
    case 'STRIPE_PUBLISHABLE_KEY':
      if (!value.startsWith('pk_')) {
        errors.push('STRIPE_PUBLISHABLE_KEY must start with "pk_"');
      }
      break;
      
    case 'STRIPE_SECRET_KEY':
      if (!value.startsWith('sk_')) {
        errors.push('STRIPE_SECRET_KEY must start with "sk_"');
      }
      break;
      
    case 'STRIPE_WEBHOOK_SECRET':
      if (!value.startsWith('whsec_')) {
        errors.push('STRIPE_WEBHOOK_SECRET must start with "whsec_"');
      }
      break;
      
    case 'FIREBASE_ADMIN_PRIVATE_KEY':
      if (!value.includes('BEGIN PRIVATE KEY')) {
        errors.push('FIREBASE_ADMIN_PRIVATE_KEY appears to be invalid format');
      }
      break;
      
    case 'FIREBASE_ADMIN_CLIENT_EMAIL':
      if (!value.includes('@') || !value.includes('.iam.gserviceaccount.com')) {
        errors.push('FIREBASE_ADMIN_CLIENT_EMAIL must be a valid service account email');
      }
      break;
  }
}

/**
 * Validates Vercel-specific deployment rules
 */
function validateVercelSpecificRules(warnings: string[], errors: string[]): void {
  const vercelEnv = process.env.VERCEL_ENV;
  const nodeEnv = process.env.NODE_ENV;
  
  // Check if we're in Vercel environment
  if (process.env.VERCEL) {
    if (!vercelEnv) {
      warnings.push('VERCEL_ENV is not set in Vercel deployment');
    }
    
    // Production-specific validations
    if (vercelEnv === 'production') {
      if (nodeEnv !== 'production') {
        warnings.push('NODE_ENV should be "production" in production deployment');
      }
      
      // Ensure all keys are production keys
      const stripeKey = process.env.STRIPE_PUBLISHABLE_KEY;
      if (stripeKey && stripeKey.includes('test')) {
        errors.push('Production deployment should not use Stripe test keys');
      }
    }
  }
}

/**
 * Gets a formatted report of environment validation results
 */
export function getEnvironmentReport(): string {
  const result = validateVercelEnvironment();
  
  let report = '🔍 Vercel Environment Validation Report\n';
  report += '=' .repeat(50) + '\n\n';
  
  if (result.isValid) {
    report += '✅ All required environment variables are properly configured!\n\n';
  } else {
    report += '❌ Environment validation failed!\n\n';
  }
  
  if (result.missing.length > 0) {
    report += '📋 Missing Required Variables:\n';
    result.missing.forEach(varName => {
      report += `  ❌ ${varName}: ${REQUIRED_VERCEL_ENV_VARS[varName as keyof typeof REQUIRED_VERCEL_ENV_VARS]}\n`;
    });
    report += '\n';
  }
  
  if (result.errors.length > 0) {
    report += '🚨 Configuration Errors:\n';
    result.errors.forEach(error => {
      report += `  ❌ ${error}\n`;
    });
    report += '\n';
  }
  
  if (result.warnings.length > 0) {
    report += '⚠️  Warnings:\n';
    result.warnings.forEach(warning => {
      report += `  ⚠️  ${warning}\n`;
    });
    report += '\n';
  }
  
  // Add deployment context
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL;
  
  if (process.env.VERCEL) {
    report += '🚀 Vercel Deployment Context:\n';
    report += `  Environment: ${vercelEnv || 'unknown'}\n`;
    report += `  URL: ${vercelUrl || 'not available'}\n`;
    report += `  Region: ${process.env.VERCEL_REGION || 'not specified'}\n`;
  } else {
    report += '💻 Local Development Environment\n';
  }
  
  return report;
}

/**
 * Throws an error if environment validation fails (for build-time validation)
 */
export function validateOrThrow(): void {
  const result = validateVercelEnvironment();
  
  if (!result.isValid) {
    const errorMessage = [
      'Environment validation failed for Vercel deployment:',
      '',
      ...result.missing.map(v => `Missing: ${v}`),
      ...result.errors.map(e => `Error: ${e}`)
    ].join('\n');
    
    throw new Error(errorMessage);
  }
}

/**
 * Client-safe environment validation (excludes server-only variables)
 */
export function validateClientEnvironment(): EnvValidationResult {
  const clientVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'STRIPE_PUBLISHABLE_KEY',
    'RECAPTCHA_V3_SITE_KEY'
  ];
  
  const missing: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  
  clientVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else {
      validateSpecificVariable(varName, value, warnings, errors);
    }
  });
  
  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    warnings,
    errors
  };
}