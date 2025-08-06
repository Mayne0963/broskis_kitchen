#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Run this script to validate all required environment variables are set
 */

const requiredVars = {
  // Authentication
  NEXTAUTH_SECRET: 'NextAuth secret key (minimum 32 characters)',
  NEXTAUTH_URL: 'NextAuth URL for callbacks',
  
  // Stripe Payment
  STRIPE_SECRET_KEY: 'Stripe secret key',
  STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret',
  
  // Firebase
  FIREBASE_PROJECT_ID: 'Firebase project ID',
  FIREBASE_PRIVATE_KEY: 'Firebase private key',
  FIREBASE_CLIENT_EMAIL: 'Firebase client email',
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
  SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key',
  
  // Google Services
  GOOGLE_MAPS_API_KEY: 'Google Maps API key',
  
  // Email
  SENDGRID_API_KEY: 'SendGrid API key for email services',
  
  // Admin Configuration
  ADMIN_EMAILS: 'Comma-separated list of admin emails'
}

const optionalVars = {
  // OpenAI (for AI features)
  OPENAI_API_KEY: 'OpenAI API key for AI features',
  
  // Analytics
  GOOGLE_ANALYTICS_ID: 'Google Analytics tracking ID',
  
  // Development
  NODE_ENV: 'Environment (development/production)',
  
  // Monitoring
  SENTRY_DSN: 'Sentry DSN for error tracking'
}

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n')
  
  let hasErrors = false
  let hasWarnings = false
  
  // Check required variables
  console.log('📋 Required Variables:')
  Object.entries(requiredVars).forEach(([varName, description]) => {
    const value = process.env[varName]
    if (!value) {
      console.log(`❌ ${varName}: MISSING - ${description}`)
      hasErrors = true
    } else {
      // Additional validation
      if (varName === 'NEXTAUTH_SECRET' && value.length < 32) {
        console.log(`⚠️  ${varName}: TOO SHORT - Should be at least 32 characters`)
        hasWarnings = true
      } else if (varName.includes('KEY') && value.length < 10) {
        console.log(`⚠️  ${varName}: SUSPICIOUS - Key seems too short`)
        hasWarnings = true
      } else {
        console.log(`✅ ${varName}: OK`)
      }
    }
  })
  
  console.log('\n📋 Optional Variables:')
  Object.entries(optionalVars).forEach(([varName, description]) => {
    const value = process.env[varName]
    if (!value) {
      console.log(`⚪ ${varName}: NOT SET - ${description}`)
    } else {
      console.log(`✅ ${varName}: OK`)
    }
  })
  
  // Security checks
  console.log('\n🔒 Security Checks:')
  
  // Check if running in production
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Production environment detected')
    
    // Check HTTPS
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
      console.log('❌ NEXTAUTH_URL should use HTTPS in production')
      hasErrors = true
    } else {
      console.log('✅ NEXTAUTH_URL uses HTTPS')
    }
  } else {
    console.log('⚠️  Development environment detected')
  }
  
  // Check for common mistakes
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('pk_')) {
    console.log('❌ STRIPE_SECRET_KEY appears to be a publishable key (should start with sk_)')
    hasErrors = true
  }
  
  if (process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_PUBLISHABLE_KEY.startsWith('sk_')) {
    console.log('❌ STRIPE_PUBLISHABLE_KEY appears to be a secret key (should start with pk_)')
    hasErrors = true
  }
  
  // Summary
  console.log('\n📊 Summary:')
  if (hasErrors) {
    console.log('❌ Environment validation FAILED - Please fix the errors above')
    process.exit(1)
  } else if (hasWarnings) {
    console.log('⚠️  Environment validation PASSED with warnings')
    process.exit(0)
  } else {
    console.log('✅ Environment validation PASSED - All checks successful')
    process.exit(0)
  }
}

// Load environment variables from .env files
try {
  const fs = require('fs')
  const path = require('path')
  
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
  
  console.log('✅ Environment files loaded successfully')
} catch (error) {
  console.log('⚠️  Error loading environment files, using system environment variables only')
}

validateEnvironment()