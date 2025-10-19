#!/usr/bin/env node

/**
 * Environment Variable Validation Script for Broski's Kitchen
 * Run this script to validate all required environment variables are set
 * Usage: node scripts/validate-env.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ==============================================
// REQUIRED FOR FUNCTIONALITY
// ==============================================
// These variables are essential for core operations
const requiredVars = {
  // Authentication & Security
  ADMIN_EMAILS: {
    description: 'Comma-separated list of admin email addresses',
    format: 'email1@domain.com,email2@domain.com',
    validator: (value) => value.includes('@') && value.includes('.')
  },
  BK_ADMIN_CODE: {
    description: 'Admin access code for authentication',
    format: 'alphanumeric string (e.g., broski-admin-2024)',
    validator: (value) => value.length >= 8
  },
  NEXTAUTH_SECRET: {
    description: 'NextAuth.js secret key for JWT encryption',
    format: 'random string of at least 32 characters',
    validator: (value) => value.length >= 32
  },
  NEXTAUTH_URL: {
    description: 'Base URL for NextAuth.js callbacks',
    format: 'https://yourdomain.com',
    validator: (value) => value.startsWith('http')
  },

  // Firebase Configuration (Server-side)
  FIREBASE_ADMIN_CLIENT_EMAIL: {
    description: 'Firebase service account client email',
    format: 'firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com',
    validator: (value) => value.includes('@') && value.includes('firebase-adminsdk')
  },
  FIREBASE_ADMIN_PRIVATE_KEY: {
    description: 'Firebase service account private key',
    format: '-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n',
    validator: (value) => value.includes('BEGIN PRIVATE KEY')
  },
  FIREBASE_ADMIN_PROJECT_ID: {
    description: 'Firebase project ID for admin SDK',
    format: 'your-project-id',
    validator: (value) => value.length > 0 && !value.includes(' ')
  },
  FIREBASE_API_KEY: {
    description: 'Firebase Web API key (server-side)',
    format: 'AIzaSy...',
    validator: (value) => value.startsWith('AIza')
  },
  FIREBASE_APP_ID: {
    description: 'Firebase app ID',
    format: '1:123456789:web:abcdef123456',
    validator: (value) => value.includes(':web:')
  },
  FIREBASE_AUTH_DOMAIN: {
    description: 'Firebase authentication domain',
    format: 'your-project.firebaseapp.com',
    validator: (value) => value.includes('.firebaseapp.com')
  },
  FIREBASE_MESSAGING_SENDER_ID: {
    description: 'Firebase messaging sender ID',
    format: '123456789',
    validator: (value) => /^\d+$/.test(value)
  },
  FIREBASE_PROJECT_ID: {
    description: 'Firebase project ID',
    format: 'your-project-id',
    validator: (value) => value.length > 0 && !value.includes(' ')
  },
  FIREBASE_STORAGE_BUCKET: {
    description: 'Firebase storage bucket',
    format: 'your-project.appspot.com',
    validator: (value) => value.includes('.appspot.com')
  },

  // Firebase Configuration (Client-side)
  NEXT_PUBLIC_FIREBASE_API_KEY: {
    description: 'Firebase Web API key (client-exposed)',
    format: 'AIzaSy...',
    validator: (value) => value.startsWith('AIza')
  },
  NEXT_PUBLIC_FIREBASE_APP_ID: {
    description: 'Firebase app ID (client-exposed)',
    format: '1:123456789:web:abcdef123456',
    validator: (value) => value.includes(':web:')
  },
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: {
    description: 'Firebase auth domain (client-exposed)',
    format: 'your-project.firebaseapp.com',
    validator: (value) => value.includes('.firebaseapp.com')
  },
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: {
    description: 'Firebase messaging sender ID (client-exposed)',
    format: '123456789',
    validator: (value) => /^\d+$/.test(value)
  },
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
    description: 'Firebase project ID (client-exposed)',
    format: 'your-project-id',
    validator: (value) => value.length > 0 && !value.includes(' ')
  },
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: {
    description: 'Firebase storage bucket (client-exposed)',
    format: 'your-project.appspot.com',
    validator: (value) => value.includes('.appspot.com')
  },

  // Payment Processing (Stripe)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
    description: 'Stripe publishable key (client-exposed)',
    format: 'pk_live_... or pk_test_...',
    validator: (value) => value.startsWith('pk_')
  },
  STRIPE_SECRET_KEY: {
    description: 'Stripe secret key (server-only)',
    format: 'sk_live_... or sk_test_...',
    validator: (value) => value.startsWith('sk_')
  },
  STRIPE_WEBHOOK_SECRET: {
    description: 'Stripe webhook endpoint secret (server-only)',
    format: 'whsec_...',
    validator: (value) => value.startsWith('whsec_')
  },

  // Core Application Settings
  NODE_ENV: {
    description: 'Node.js environment',
    format: 'production, development, or test',
    validator: (value) => ['production', 'development', 'test'].includes(value)
  }
}

// ==============================================
// OPTIONAL FEATURES
// ==============================================
// These variables enable additional features when configured
const optionalVars = {
  // Age Verification
  AGE_VERIFICATION_EXPIRY_DAYS: {
    description: 'Server-side age verification expiry (days)',
    format: 'number (e.g., 30)',
    validator: (value) => !isNaN(parseInt(value))
  },
  NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS: {
    description: 'Client-side age verification expiry (days)',
    format: 'number (e.g., 30)',
    validator: (value) => !isNaN(parseInt(value))
  },

  // AI & Chat Features
  OPENAI_API_KEY: {
    description: 'OpenAI API key for AI-powered features',
    format: 'sk-...',
    validator: (value) => value.startsWith('sk-')
  },

  // Alerting & Monitoring
  ALERT_EMAIL: {
    description: 'Email address for system alerts',
    format: 'admin@yourdomain.com',
    validator: (value) => value.includes('@') && value.includes('.')
  },
  ALERT_PHONE: {
    description: 'Phone number for SMS alerts',
    format: '+1234567890',
    validator: (value) => value.startsWith('+') && /^\+\d+$/.test(value)
  },
  ALERT_SMS_ENABLED: {
    description: 'Enable SMS alerts',
    format: 'true or false',
    validator: (value) => ['true', 'false'].includes(value.toLowerCase())
  },
  ALERT_WEBHOOK_URL: {
    description: 'Webhook URL for alert notifications',
    format: 'https://hooks.slack.com/services/...',
    validator: (value) => value.startsWith('https://')
  },
  ALLOWED_ADMIN_EMAILS: {
    description: 'Alternative admin emails configuration',
    format: 'email1@domain.com,email2@domain.com',
    validator: (value) => value.includes('@') && value.includes('.')
  },
  APP_VERSION: {
    description: 'Application version for logging',
    format: '1.0.0',
    validator: (value) => /^\d+\.\d+\.\d+/.test(value)
  },

  // Caching & Performance
  UPSTASH_REDIS_REST_TOKEN: {
    description: 'Upstash Redis authentication token',
    format: 'AXXXabc...',
    validator: (value) => value.length > 10
  },
  UPSTASH_REDIS_REST_URL: {
    description: 'Upstash Redis REST endpoint URL',
    format: 'https://xxx-xxx-xxx.upstash.io',
    validator: (value) => value.includes('upstash.io')
  },

  // CAPTCHA & Security
  HCAPTCHA_SECRET_KEY: {
    description: 'hCaptcha secret key for server-side verification',
    format: '0x...',
    validator: (value) => value.startsWith('0x')
  },
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: {
    description: 'hCaptcha site key (client-exposed)',
    format: '10000000-ffff-ffff-ffff-000000000001',
    validator: (value) => value.includes('-')
  },
  NEXT_PUBLIC_RECAPTCHA_V3_SECRET_KEY: {
    description: 'reCAPTCHA v3 secret key (client-exposed)',
    format: '6L...',
    validator: (value) => value.startsWith('6L')
  },
  NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY: {
    description: 'reCAPTCHA v3 site key (client-exposed)',
    format: '6L...',
    validator: (value) => value.startsWith('6L')
  },
  RECAPTCHA_V3_SECRET_KEY: {
    description: 'reCAPTCHA v3 secret key (server-side)',
    format: '6L...',
    validator: (value) => value.startsWith('6L')
  },
  RECAPTCHA_V3_SITE_KEY: {
    description: 'reCAPTCHA v3 site key (server-side)',
    format: '6L...',
    validator: (value) => value.startsWith('6L')
  },

  // Cron Jobs & Automation
  ADMIN_SETUP_SECRET: {
    description: 'Secret for admin setup operations',
    format: 'random_secret_string',
    validator: (value) => value.length >= 16
  },
  CRON_SECRET: {
    description: 'Secret key for authenticating cron job requests',
    format: 'random string',
    validator: (value) => value.length >= 16
  },

  // Delivery Services
  OTW_API_KEY: {
    description: 'On The Way delivery service API key',
    format: 'api_key_...',
    validator: (value) => value.includes('api_key') || value.length > 10
  },
  OTW_API_URL: {
    description: 'On The Way API base URL',
    format: 'https://api.otw-delivery.com',
    validator: (value) => value.startsWith('https://')
  },
  OTW_BASE_URL: {
    description: 'On The Way base URL',
    format: 'https://api.otw.com/v1',
    validator: (value) => value.startsWith('https://')
  },
  OTW_RESTAURANT_ID: {
    description: 'Restaurant ID for OTW delivery service',
    format: 'restaurant_123',
    validator: (value) => value.length > 0
  },
  OTW_WEBHOOK_SECRET: {
    description: 'On The Way webhook secret',
    format: 'webhook_secret_...',
    validator: (value) => value.length >= 16
  },

  // Email Services
  FROM_EMAIL: {
    description: 'Default sender email address',
    format: 'noreply@yourdomain.com',
    validator: (value) => value.includes('@') && value.includes('.')
  },
  RESEND_API_KEY: {
    description: 'Resend email service API key',
    format: 're_...',
    validator: (value) => value.startsWith('re_')
  },
  SENDGRID_API_KEY: {
    description: 'SendGrid email service API key',
    format: 'SG...',
    validator: (value) => value.startsWith('SG')
  },

  // Firebase Extended Features
  FIREBASE_ADMIN_STORAGE_BUCKET: {
    description: 'Firebase admin storage bucket',
    format: 'your-project-admin.appspot.com',
    validator: (value) => value.includes('.appspot.com')
  },
  FIREBASE_CLIENT_EMAIL: {
    description: 'Firebase client email (alternative format)',
    format: 'firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com',
    validator: (value) => value.includes('@') && value.includes('firebase-adminsdk')
  },
  FIREBASE_PRIVATE_KEY: {
    description: 'Firebase private key (alternative format)',
    format: '-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n',
    validator: (value) => value.includes('BEGIN PRIVATE KEY')
  },
  FIREBASE_SERVICE_ACCOUNT: {
    description: 'Complete Firebase service account JSON',
    format: '{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}',
    validator: (value) => {
      try {
        const parsed = JSON.parse(value)
        return parsed.type === 'service_account' && parsed.project_id && parsed.private_key
      } catch {
        return false
      }
    }
  },
  FIREBASE_STORAGE_BUCKET_UPLOADS: {
    description: 'Firebase uploads storage bucket',
    format: 'your-project-uploads.appspot.com',
    validator: (value) => value.includes('.appspot.com')
  },
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: {
    description: 'Firebase Analytics measurement ID (client-exposed)',
    format: 'G-XXXXXXXXXX',
    validator: (value) => value.startsWith('G-')
  },
  USE_FIREBASE_EMULATOR: {
    description: 'Enable Firebase emulator for development',
    format: 'true or false',
    validator: (value) => ['true', 'false'].includes(value.toLowerCase())
  },

  // Google Services
  GOOGLE_MAPS_API_KEY: {
    description: 'Google Maps API key (server-side)',
    format: 'AIzaSy...',
    validator: (value) => value.startsWith('AIza')
  },
  GOOGLE_SITE_VERIFICATION: {
    description: 'Google Search Console verification code',
    format: 'verification_code',
    validator: (value) => value.length > 0
  },
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: {
    description: 'Google Maps API key (client-exposed)',
    format: 'AIzaSy...',
    validator: (value) => value.startsWith('AIza')
  },

  // Media & Content
  NEXT_PUBLIC_RADIO_URL: {
    description: 'Radio stream URL for audio player',
    format: 'https://stream.example.com/radio.mp3',
    validator: (value) => value.startsWith('http')
  },

  // Push Notifications
  VAPID_PRIVATE_KEY: {
    description: 'VAPID private key for push notifications',
    format: 'private_key_string',
    validator: (value) => value.length >= 32
  },
  VAPID_PUBLIC_KEY: {
    description: 'VAPID public key for push notifications',
    format: 'public_key_string',
    validator: (value) => value.length >= 32
  },

  // Site Configuration
  BASE_URL: {
    description: 'Base URL for API calls and redirects',
    format: 'https://yourdomain.com',
    validator: (value) => value.startsWith('http')
  },
  NEXT_PUBLIC_BASE_URL: {
    description: 'Base URL (client-exposed)',
    format: 'https://yourdomain.com',
    validator: (value) => value.startsWith('http')
  },
  NEXT_PUBLIC_SITE_URL: {
    description: 'Site URL for metadata and SEO',
    format: 'https://yourdomain.com',
    validator: (value) => value.startsWith('http')
  },
  SITE_URL: {
    description: 'Site URL for server-side operations',
    format: 'https://yourdomain.com',
    validator: (value) => value.startsWith('http')
  },

  // Additional Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: {
    description: 'Stripe publishable key (server-side backup)',
    format: 'pk_live_... or pk_test_...',
    validator: (value) => value.startsWith('pk_')
  },

  // Testing & Development
  DISABLE_AUTH_FOR_TESTING: {
    description: 'Disable authentication for testing',
    format: 'true or false',
    validator: (value) => ['true', 'false'].includes(value.toLowerCase())
  },
  DISABLE_FORCED_REFRESH: {
    description: 'Disable forced page refresh on errors',
    format: 'true or false',
    validator: (value) => ['true', 'false'].includes(value.toLowerCase())
  }
}

function validateVariable(varName, config, value, isRequired = false) {
  const results = {
    status: 'ok',
    message: '',
    warnings: []
  }

  if (!value) {
    if (isRequired) {
      results.status = 'error'
      results.message = `MISSING - ${config.description}`
    } else {
      results.status = 'not_set'
      results.message = `NOT SET - ${config.description}`
    }
    return results
  }

  // Run custom validator if provided
  if (config.validator && !config.validator(value)) {
    results.status = 'warning'
    results.message = `FORMAT WARNING - Expected format: ${config.format}`
    results.warnings.push(`${varName} format may be incorrect`)
  }

  // Additional security checks
  if (varName.includes('SECRET') || varName.includes('PRIVATE_KEY')) {
    if (value.length < 16) {
      results.warnings.push(`${varName} seems too short for a secret`)
    }
  }

  if (varName.includes('URL') && !value.startsWith('http')) {
    results.warnings.push(`${varName} should be a valid URL`)
  }

  if (results.status === 'ok') {
    results.message = 'OK'
  }

  return results
}

function validateEnvironment() {
  console.log('🔍 Validating Broski\'s Kitchen environment variables...\n')
  
  let hasErrors = false
  let hasWarnings = false
  const warnings = []
  
  // Check required variables
  console.log('================================================')
  console.log('  SECTION 1: REQUIRED FOR FUNCTIONALITY')
  console.log('================================================')
  console.log('These variables are essential for core operations:\n')
  
  Object.entries(requiredVars).forEach(([varName, config]) => {
    const value = process.env[varName]
    const result = validateVariable(varName, config, value, true)
    
    switch (result.status) {
      case 'error':
        console.log(`❌ ${varName}: ${result.message}`)
        console.log(`   Format: ${config.format}`)
        hasErrors = true
        break
      case 'warning':
        console.log(`⚠️  ${varName}: ${result.message}`)
        hasWarnings = true
        break
      default:
        console.log(`✅ ${varName}: ${result.message}`)
    }
    
    if (result.warnings.length > 0) {
      warnings.push(...result.warnings)
      hasWarnings = true
    }
  })
  
  console.log('\n================================================')
  console.log('  SECTION 2: OPTIONAL FEATURES')
  console.log('================================================')
  console.log('These variables enable additional features when configured:\n')
  
  Object.entries(optionalVars).forEach(([varName, config]) => {
    const value = process.env[varName]
    const result = validateVariable(varName, config, value, false)
    
    switch (result.status) {
      case 'not_set':
        console.log(`⚪ ${varName}: ${result.message}`)
        break
      case 'warning':
        console.log(`⚠️  ${varName}: ${result.message}`)
        hasWarnings = true
        break
      default:
        console.log(`✅ ${varName}: ${result.message}`)
    }
    
    if (result.warnings.length > 0) {
      warnings.push(...result.warnings)
      hasWarnings = true
    }
  })
  
  // Enhanced Security checks
  console.log('\n🔒 Security & Configuration Checks:')
  
  // Environment check
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') {
    console.log('✅ Production environment detected')
    
    // HTTPS checks for production
    const nextAuthUrl = process.env.NEXTAUTH_URL
    if (nextAuthUrl && !nextAuthUrl.startsWith('https://')) {
      console.log('❌ NEXTAUTH_URL should use HTTPS in production')
      hasErrors = true
    } else if (nextAuthUrl) {
      console.log('✅ NEXTAUTH_URL uses HTTPS')
    }
  } else {
    console.log(`⚠️  ${nodeEnv || 'undefined'} environment detected`)
  }
  
  // Stripe key validation
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const stripePublishable = process.env.STRIPE_PUBLISHABLE_KEY
  const stripePublicPublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  
  if (stripeSecret && stripeSecret.startsWith('pk_')) {
    console.log('❌ STRIPE_SECRET_KEY appears to be a publishable key (should start with sk_)')
    hasErrors = true
  }
  
  if (stripePublishable && stripePublishable.startsWith('sk_')) {
    console.log('❌ STRIPE_PUBLISHABLE_KEY appears to be a secret key (should start with pk_)')
    hasErrors = true
  }
  
  if (stripePublicPublishable && stripePublicPublishable.startsWith('sk_')) {
    console.log('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY appears to be a secret key (should start with pk_)')
    hasErrors = true
  }
  
  // Firebase configuration consistency
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID
  const firebasePublicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  
  if (firebaseProjectId && firebasePublicProjectId && firebaseProjectId !== firebasePublicProjectId) {
    console.log('⚠️  Firebase project IDs don\'t match between server and client configs')
    hasWarnings = true
  }
  
  // Check for placeholder values
  const placeholderPatterns = ['your-', 'example', 'placeholder', 'xxx', 'changeme']
  Object.keys({...requiredVars, ...optionalVars}).forEach(varName => {
    const value = process.env[varName]
    if (value && placeholderPatterns.some(pattern => value.toLowerCase().includes(pattern))) {
      console.log(`⚠️  ${varName} appears to contain placeholder values`)
      hasWarnings = true
    }
  })
  
  // Display warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Additional Warnings:')
    warnings.forEach(warning => console.log(`   • ${warning}`))
  }
  
  // Summary
  console.log('\n📊 Validation Summary:')
  const requiredCount = Object.keys(requiredVars).length
  const optionalCount = Object.keys(optionalVars).length
  const requiredSet = Object.keys(requiredVars).filter(key => process.env[key]).length
  const optionalSet = Object.keys(optionalVars).filter(key => process.env[key]).length
  
  console.log(`   Required variables: ${requiredSet}/${requiredCount} configured`)
  console.log(`   Optional variables: ${optionalSet}/${optionalCount} configured`)
  
  if (hasErrors) {
    console.log('\n❌ Environment validation FAILED - Please fix the errors above')
    console.log('   Refer to SETUP_GUIDE.md for configuration instructions')
    process.exit(1)
  } else if (hasWarnings) {
    console.log('\n⚠️  Environment validation PASSED with warnings')
    console.log('   Consider reviewing the warnings above for optimal configuration')
    process.exit(0)
  } else {
    console.log('\n✅ Environment validation PASSED - All checks successful')
    console.log('   Your environment is properly configured!')
    process.exit(0)
  }
}

// Load environment variables from .env files
function loadEnvironmentFiles() {
  try {
    // Simple .env parser
    function loadEnvFile(filePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n')
        
        lines.forEach(line => {
          const trimmed = line.trim()
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=')
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').replace(/^["']|["']$/g, '')
              if (!process.env[key]) {
                process.env[key] = value
              }
            }
          }
        })
      } catch (error) {
        // File doesn't exist or can't be read
      }
    }
    
    // Load .env.local first (highest priority)
    loadEnvFile(path.join(process.cwd(), '.env.local'))
    // Load .env as fallback
    loadEnvFile(path.join(process.cwd(), '.env'))
    
    console.log('✅ Environment files loaded successfully\n')
  } catch (error) {
    console.log('⚠️  Error loading environment files, using system environment variables only\n')
  }
}

// Main execution
loadEnvironmentFiles()
validateEnvironment()