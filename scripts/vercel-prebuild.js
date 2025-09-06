#!/usr/bin/env node

/**
 * Vercel Pre-build Validation Script
 * Validates environment variables, files, and configuration before Vercel deployment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root directory
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${message}${colors.reset}`);
  log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Required environment variables for Vercel deployment
const REQUIRED_ENV_VARS = {
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

// Critical files that must exist
const REQUIRED_FILES = [
  'package.json',
  'next.config.js',
  'vercel.json',
  'public/manifest.json',
  'public/icons/icon-192x192.svg'
];

// Optional but recommended files
const RECOMMENDED_FILES = [
  '.vercelignore',
  'public/sw.js',
  'public/offline.html'
];

function validateEnvironmentVariables() {
  logHeader('🔍 VALIDATING ENVIRONMENT VARIABLES');
  
  let hasErrors = false;
  let hasWarnings = false;
  const missing = [];
  const warnings = [];
  
  // Check required variables
  log('📋 Checking Required Variables:', 'blue');
  Object.entries(REQUIRED_ENV_VARS).forEach(([varName, description]) => {
    const value = process.env[varName];
    if (!value) {
      log(`  ❌ ${varName}: MISSING - ${description}`, 'red');
      missing.push(varName);
      hasErrors = true;
    } else {
      // Validate specific formats
      const validation = validateVariableFormat(varName, value);
      if (validation.isValid) {
        log(`  ✅ ${varName}: OK`, 'green');
      } else {
        log(`  ⚠️  ${varName}: ${validation.message}`, 'yellow');
        warnings.push(`${varName}: ${validation.message}`);
        hasWarnings = true;
      }
    }
  });
  
  // Vercel-specific checks
  log('\n🚀 Vercel Environment Checks:', 'blue');
  if (process.env.VERCEL) {
    log('  ✅ Running in Vercel environment', 'green');
    log(`  📍 Environment: ${process.env.VERCEL_ENV || 'unknown'}`, 'cyan');
    log(`  🌐 URL: ${process.env.VERCEL_URL || 'not available'}`, 'cyan');
    log(`  🗺️  Region: ${process.env.VERCEL_REGION || 'not specified'}`, 'cyan');
    
    // Production-specific validations
    if (process.env.VERCEL_ENV === 'production') {
      log('\n🔒 Production Environment Validations:', 'magenta');
      
      if (process.env.NODE_ENV !== 'production') {
        log('  ⚠️  NODE_ENV should be "production" in production deployment', 'yellow');
        hasWarnings = true;
      } else {
        log('  ✅ NODE_ENV is correctly set to production', 'green');
      }
      
      // Check for test keys in production
      const stripeKey = process.env.STRIPE_PUBLISHABLE_KEY;
      if (stripeKey && stripeKey.includes('test')) {
        log('  ❌ Production deployment should not use Stripe test keys', 'red');
        hasErrors = true;
      } else {
        log('  ✅ Stripe keys appear to be production keys', 'green');
      }
    }
  } else {
    log('  💻 Running in local development environment', 'cyan');
  }
  
  return { hasErrors, hasWarnings, missing, warnings };
}

function validateVariableFormat(varName, value) {
  switch (varName) {
    case 'NEXTAUTH_SECRET':
      return {
        isValid: value.length >= 32,
        message: value.length < 32 ? 'Should be at least 32 characters long' : 'OK'
      };
      
    case 'NEXTAUTH_URL':
      const isValidUrl = value.startsWith('http');
      const isHttps = value.startsWith('https://');
      return {
        isValid: isValidUrl && (process.env.VERCEL_ENV !== 'production' || isHttps),
        message: !isValidUrl ? 'Must be a valid URL' : 
                !isHttps && process.env.VERCEL_ENV === 'production' ? 'Should use HTTPS in production' : 'OK'
      };
      
    case 'STRIPE_PUBLISHABLE_KEY':
      return {
        isValid: value.startsWith('pk_'),
        message: value.startsWith('pk_') ? 'OK' : 'Must start with "pk_"'
      };
      
    case 'STRIPE_SECRET_KEY':
      return {
        isValid: value.startsWith('sk_'),
        message: value.startsWith('sk_') ? 'OK' : 'Must start with "sk_"'
      };
      
    case 'STRIPE_WEBHOOK_SECRET':
      return {
        isValid: value.startsWith('whsec_'),
        message: value.startsWith('whsec_') ? 'OK' : 'Must start with "whsec_"'
      };
      
    case 'FIREBASE_ADMIN_CLIENT_EMAIL':
      const isValidEmail = value.includes('@') && value.includes('.iam.gserviceaccount.com');
      return {
        isValid: isValidEmail,
        message: isValidEmail ? 'OK' : 'Must be a valid service account email'
      };
      
    default:
      return { isValid: true, message: 'OK' };
  }
}

function validateRequiredFiles() {
  logHeader('📁 VALIDATING REQUIRED FILES');
  
  let hasErrors = false;
  const missing = [];
  
  log('📋 Checking Required Files:', 'blue');
  REQUIRED_FILES.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      log(`  ✅ ${filePath}: EXISTS`, 'green');
    } else {
      log(`  ❌ ${filePath}: MISSING`, 'red');
      missing.push(filePath);
      hasErrors = true;
    }
  });
  
  log('\n📋 Checking Recommended Files:', 'blue');
  RECOMMENDED_FILES.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      log(`  ✅ ${filePath}: EXISTS`, 'green');
    } else {
      log(`  ⚠️  ${filePath}: MISSING (recommended)`, 'yellow');
    }
  });
  
  return { hasErrors, missing };
}

function validatePackageJson() {
  logHeader('📦 VALIDATING PACKAGE.JSON');
  
  let hasErrors = false;
  const issues = [];
  
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['build', 'start', 'dev'];
    log('📋 Checking Required Scripts:', 'blue');
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        log(`  ✅ ${script}: ${packageJson.scripts[script]}`, 'green');
      } else {
        log(`  ❌ ${script}: MISSING`, 'red');
        issues.push(`Missing script: ${script}`);
        hasErrors = true;
      }
    });
    
    // Check for Vercel-specific configurations
    log('\n🚀 Vercel Configuration:', 'blue');
    if (packageJson.engines) {
      log(`  ✅ Node.js version specified: ${packageJson.engines.node || 'not specified'}`, 'green');
    } else {
      log('  ⚠️  No Node.js version specified in engines field', 'yellow');
    }
    
  } catch (error) {
    log(`  ❌ Error reading package.json: ${error.message}`, 'red');
    hasErrors = true;
    issues.push('Cannot read package.json');
  }
  
  return { hasErrors, issues };
}

async function validateNextConfig() {
  logHeader('⚙️  VALIDATING NEXT.CONFIG.JS');
  
  let hasErrors = false;
  const issues = [];
  
  try {
    const configPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(configPath)) {
      log('  ✅ next.config.js exists', 'green');
      
      // Basic syntax check by importing the file
      const configModule = await import(`file://${configPath}`);
      const config = configModule.default || configModule;
      
      if (typeof config === 'object') {
        log('  ✅ Configuration is valid JavaScript object', 'green');
        
        // Check for important Vercel-related configurations
        if (config.output) {
          log(`  ✅ Output configuration: ${config.output}`, 'green');
        }
        
        if (config.experimental) {
          log('  ✅ Experimental features configured', 'green');
        }
        
      } else {
        log('  ❌ Configuration is not a valid object', 'red');
        hasErrors = true;
        issues.push('Invalid next.config.js format');
      }
    } else {
      log('  ❌ next.config.js not found', 'red');
      hasErrors = true;
      issues.push('Missing next.config.js');
    }
  } catch (error) {
    log(`  ❌ Error validating next.config.js: ${error.message}`, 'red');
    hasErrors = true;
    issues.push(`next.config.js error: ${error.message}`);
  }
  
  return { hasErrors, issues };
}

function generateSummaryReport(results) {
  logHeader('📊 VALIDATION SUMMARY');
  
  const totalErrors = results.reduce((sum, result) => sum + (result.hasErrors ? 1 : 0), 0);
  const totalWarnings = results.reduce((sum, result) => sum + (result.hasWarnings ? 1 : 0), 0);
  
  if (totalErrors === 0) {
    log('🎉 All validations passed! Ready for Vercel deployment.', 'green');
  } else {
    log(`❌ ${totalErrors} validation(s) failed. Deployment may fail.`, 'red');
  }
  
  if (totalWarnings > 0) {
    log(`⚠️  ${totalWarnings} warning(s) found. Consider addressing these issues.`, 'yellow');
  }
  
  // Deployment readiness
  log('\n🚀 Deployment Readiness:', 'blue');
  if (totalErrors === 0) {
    log('  ✅ READY FOR DEPLOYMENT', 'green');
  } else {
    log('  ❌ NOT READY - Fix errors before deploying', 'red');
  }
  
  return totalErrors === 0;
}

async function main() {
  log(`${colors.bold}${colors.magenta}🚀 Vercel Pre-build Validation${colors.reset}`);
  log(`${colors.cyan}Starting validation for Vercel deployment...${colors.reset}\n`);
  
  const results = [
    validateEnvironmentVariables(),
    validateRequiredFiles(),
    validatePackageJson(),
    await validateNextConfig()
  ];
  
  const isReady = generateSummaryReport(results);
  
  if (!isReady) {
    log('\n💡 Tips for fixing issues:', 'cyan');
    log('  1. Check your .env.local file for missing environment variables', 'cyan');
    log('  2. Ensure all required files are present in your repository', 'cyan');
    log('  3. Verify your Vercel project settings match your environment variables', 'cyan');
    log('  4. Test your build locally with: npm run build', 'cyan');
    
    process.exit(1);
  }
  
  log('\n✨ Validation complete! Proceeding with build...', 'green');
}

// Run validation
main().catch(error => {
  console.error(colors.red + 'Fatal error during validation:' + colors.reset);
  console.error(error);
  process.exit(1);
});

export {
  validateEnvironmentVariables,
  validateRequiredFiles,
  validatePackageJson,
  validateNextConfig,
  generateSummaryReport
};