#!/usr/bin/env bash
set -euo pipefail

echo "=============================================="
echo "  Broski's Kitchen - Vercel Environment Setup"
echo "=============================================="
echo ""
echo "This script helps you configure all environment variables for Vercel deployment."
echo "Make sure you are logged in: vercel login"
echo "Then run each command and paste the secret when prompted."
echo ""

# ==============================================
# REQUIRED FOR FUNCTIONALITY
# ==============================================
echo "================================================"
echo "  SECTION 1: REQUIRED FOR FUNCTIONALITY"
echo "================================================"
echo "These variables are essential for core operations:"
echo ""

# -------------------------------
# Authentication & Security
# -------------------------------
echo "# Authentication & Security"
echo "# ========================="

echo "# ADMIN_EMAILS - Comma-separated list of admin email addresses"
echo "# Format: email1@domain.com,email2@domain.com"
vercel env add ADMIN_EMAILS production
echo ""

echo "# BK_ADMIN_CODE - Admin access code for authentication"
echo "# Format: alphanumeric string (e.g., broski-admin-2024)"
vercel env add BK_ADMIN_CODE production
echo ""

echo "# NEXTAUTH_SECRET - NextAuth.js secret key for JWT encryption (minimum 32 characters)"
echo "# Format: random string of at least 32 characters"
vercel env add NEXTAUTH_SECRET production
echo ""

echo "# NEXTAUTH_URL - Base URL for NextAuth.js callbacks"
echo "# Format: https://yourdomain.com"
vercel env add NEXTAUTH_URL production
echo ""

# -------------------------------
# Firebase Configuration (Server)
# -------------------------------
echo "# Firebase Configuration (Server-side)"
echo "# ====================================="

echo "# FIREBASE_ADMIN_CLIENT_EMAIL - Firebase service account client email"
echo "# Format: firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com"
vercel env add FIREBASE_ADMIN_CLIENT_EMAIL production
echo ""

echo "# FIREBASE_ADMIN_PRIVATE_KEY - Firebase service account private key"
echo "# Format: -----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
vercel env add FIREBASE_ADMIN_PRIVATE_KEY production
echo ""

echo "# FIREBASE_ADMIN_PROJECT_ID - Firebase project ID for admin SDK"
echo "# Format: your-project-id"
vercel env add FIREBASE_ADMIN_PROJECT_ID production
echo ""

echo "# FIREBASE_API_KEY - Firebase Web API key (server-side)"
echo "# Format: AIzaSy..."
vercel env add FIREBASE_API_KEY production
echo ""

echo "# FIREBASE_APP_ID - Firebase app ID"
echo "# Format: 1:123456789:web:abcdef123456"
vercel env add FIREBASE_APP_ID production
echo ""

echo "# FIREBASE_AUTH_DOMAIN - Firebase authentication domain"
echo "# Format: your-project.firebaseapp.com"
vercel env add FIREBASE_AUTH_DOMAIN production
echo ""

echo "# FIREBASE_MESSAGING_SENDER_ID - Firebase messaging sender ID"
echo "# Format: 123456789"
vercel env add FIREBASE_MESSAGING_SENDER_ID production
echo ""

echo "# FIREBASE_PROJECT_ID - Firebase project ID"
echo "# Format: your-project-id"
vercel env add FIREBASE_PROJECT_ID production
echo ""

echo "# FIREBASE_SERVICE_ACCOUNT - Complete Firebase service account JSON (alternative to individual keys)"
echo "# Format: {\"type\":\"service_account\",\"project_id\":\"...\",\"private_key\":\"...\",\"client_email\":\"...\"}"
vercel env add FIREBASE_SERVICE_ACCOUNT production
echo ""

echo "# FIREBASE_STORAGE_BUCKET - Firebase storage bucket"
echo "# Format: your-project.appspot.com"
vercel env add FIREBASE_STORAGE_BUCKET production
echo ""

# -------------------------------
# Firebase Configuration (Client)
# -------------------------------
echo "# Firebase Configuration (Client-side - NEXT_PUBLIC_*)"
echo "# ====================================================="

echo "# NEXT_PUBLIC_FIREBASE_API_KEY - Firebase Web API key (client-exposed)"
echo "# Format: AIzaSy..."
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
echo ""

echo "# NEXT_PUBLIC_FIREBASE_APP_ID - Firebase app ID (client-exposed)"
echo "# Format: 1:123456789:web:abcdef123456"
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
echo ""

echo "# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN - Firebase auth domain (client-exposed)"
echo "# Format: your-project.firebaseapp.com"
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
echo ""

echo "# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID - Firebase messaging sender ID (client-exposed)"
echo "# Format: 123456789"
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
echo ""

echo "# NEXT_PUBLIC_FIREBASE_PROJECT_ID - Firebase project ID (client-exposed)"
echo "# Format: your-project-id"
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
echo ""

echo "# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET - Firebase storage bucket (client-exposed)"
echo "# Format: your-project.appspot.com"
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
echo ""

# -------------------------------
# Payment Processing (Stripe)
# -------------------------------
echo "# Payment Processing (Stripe)"
echo "# ============================"

echo "# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Stripe publishable key (client-exposed)"
echo "# Format: pk_live_... or pk_test_..."
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
echo ""

echo "# STRIPE_PUBLISHABLE_KEY - Stripe publishable key (server-side backup)"
echo "# Format: pk_live_... or pk_test_..."
vercel env add STRIPE_PUBLISHABLE_KEY production
echo ""

echo "# STRIPE_SECRET_KEY - Stripe secret key (server-only)"
echo "# Format: sk_live_... or sk_test_..."
vercel env add STRIPE_SECRET_KEY production
echo ""

echo "# STRIPE_WEBHOOK_SECRET - Stripe webhook endpoint secret (server-only)"
echo "# Format: whsec_..."
vercel env add STRIPE_WEBHOOK_SECRET production
echo ""

# -------------------------------
# Core Application Settings
# -------------------------------
echo "# Core Application Settings"
echo "# =========================="

echo "# NODE_ENV - Node.js environment"
echo "# Format: production"
vercel env add NODE_ENV production
echo ""

# ==============================================
# OPTIONAL FEATURES
# ==============================================
echo ""
echo "================================================"
echo "  SECTION 2: OPTIONAL FEATURES"
echo "================================================"
echo "These variables enable additional features when configured:"
echo ""

# -------------------------------
# Age Verification
# -------------------------------
echo "# Age Verification"
echo "# ================"

echo "# AGE_VERIFICATION_EXPIRY_DAYS - Server-side age verification expiry (days)"
echo "# Format: number (e.g., 30)"
vercel env add AGE_VERIFICATION_EXPIRY_DAYS production
echo ""

echo "# NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS - Client-side age verification expiry (days)"
echo "# Format: number (e.g., 30)"
vercel env add NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS production
echo ""

# -------------------------------
# AI & Chat Features
# -------------------------------
echo "# AI & Chat Features"
echo "# =================="

echo "# OPENAI_API_KEY - OpenAI API key for AI-powered features"
echo "# Format: sk-..."
vercel env add OPENAI_API_KEY production
echo ""

# -------------------------------
# Alerting & Monitoring
# -------------------------------
echo "# Alerting & Monitoring"
echo "# ====================="

echo "# ALERT_EMAIL - Email address for system alerts"
echo "# Format: admin@yourdomain.com"
vercel env add ALERT_EMAIL production
echo ""

echo "# ALERT_PHONE - Phone number for SMS alerts"
echo "# Format: +1234567890"
vercel env add ALERT_PHONE production
echo ""

echo "# ALERT_SMS_ENABLED - Enable SMS alerts"
echo "# Format: true or false"
vercel env add ALERT_SMS_ENABLED production
echo ""

echo "# ALERT_WEBHOOK_URL - Webhook URL for alert notifications"
echo "# Format: https://hooks.slack.com/services/..."
vercel env add ALERT_WEBHOOK_URL production
echo ""

echo "# APP_VERSION - Application version for logging"
echo "# Format: 1.0.0"
vercel env add APP_VERSION production
echo ""

# -------------------------------
# Caching & Performance
# -------------------------------
echo "# Caching & Performance"
echo "# ====================="

echo "# UPSTASH_REDIS_REST_TOKEN - Upstash Redis authentication token"
echo "# Format: AXXXabc..."
vercel env add UPSTASH_REDIS_REST_TOKEN production
echo ""

echo "# UPSTASH_REDIS_REST_URL - Upstash Redis REST endpoint URL"
echo "# Format: https://xxx-xxx-xxx.upstash.io"
vercel env add UPSTASH_REDIS_REST_URL production
echo ""

# -------------------------------
# CAPTCHA & Security
# -------------------------------
echo "# CAPTCHA & Security"
echo "# =================="

echo "# HCAPTCHA_SECRET_KEY - hCaptcha secret key for server-side verification"
echo "# Format: 0x..."
vercel env add HCAPTCHA_SECRET_KEY production
echo ""

echo "# NEXT_PUBLIC_HCAPTCHA_SITE_KEY - hCaptcha site key (client-exposed)"
echo "# Format: 10000000-ffff-ffff-ffff-000000000001"
vercel env add NEXT_PUBLIC_HCAPTCHA_SITE_KEY production
echo ""

echo "# NEXT_PUBLIC_RECAPTCHA_V3_SECRET_KEY - reCAPTCHA v3 secret key (client-exposed)"
echo "# Format: 6L..."
vercel env add NEXT_PUBLIC_RECAPTCHA_V3_SECRET_KEY production
echo ""

echo "# NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY - reCAPTCHA v3 site key (client-exposed)"
echo "# Format: 6L..."
vercel env add NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY production
echo ""

echo "# RECAPTCHA_V3_SECRET_KEY - reCAPTCHA v3 secret key (server-side)"
echo "# Format: 6L..."
vercel env add RECAPTCHA_V3_SECRET_KEY production
echo ""

echo "# RECAPTCHA_V3_SITE_KEY - reCAPTCHA v3 site key (server-side)"
echo "# Format: 6L..."
vercel env add RECAPTCHA_V3_SITE_KEY production
echo ""

# -------------------------------
# Cron Jobs & Automation
# -------------------------------
echo "# Cron Jobs & Automation"
echo "# ======================"

echo "# CRON_SECRET - Secret key for authenticating cron job requests"
echo "# Format: random string"
vercel env add CRON_SECRET production
echo ""

# -------------------------------
# Delivery Services
# -------------------------------
echo "# Delivery Services"
echo "# =================="

echo "# OTW_API_KEY - On The Way delivery service API key"
echo "# Format: api_key_..."
vercel env add OTW_API_KEY production
echo ""

echo "# OTW_API_URL - On The Way API base URL"
echo "# Format: https://api.otw-delivery.com"
vercel env add OTW_API_URL production
echo ""

echo "# OTW_BASE_URL - On The Way base URL"
echo "# Format: https://api.otw.com/v1"
vercel env add OTW_BASE_URL production
echo ""

echo "# OTW_RESTAURANT_ID - Restaurant ID for OTW delivery service"
echo "# Format: restaurant_123"
vercel env add OTW_RESTAURANT_ID production
echo ""

echo "# OTW_WEBHOOK_SECRET - On The Way webhook secret"
echo "# Format: webhook_secret_..."
vercel env add OTW_WEBHOOK_SECRET production
echo ""

# -------------------------------
# Email Services
# -------------------------------
echo "# Email Services"
echo "# ==============="

echo "# FROM_EMAIL - Default sender email address"
echo "# Format: noreply@yourdomain.com"
vercel env add FROM_EMAIL production
echo ""

echo "# RESEND_API_KEY - Resend email service API key"
echo "# Format: re_..."
vercel env add RESEND_API_KEY production
echo ""

echo "# SENDGRID_API_KEY - SendGrid email service API key"
echo "# Format: SG..."
vercel env add SENDGRID_API_KEY production
echo ""

# -------------------------------
# Firebase Extended Features
# -------------------------------
echo "# Firebase Extended Features"
echo "# ==========================="

echo "# FIREBASE_ADMIN_STORAGE_BUCKET - Firebase admin storage bucket"
echo "# Format: your-project-admin.appspot.com"
vercel env add FIREBASE_ADMIN_STORAGE_BUCKET production
echo ""

echo "# FIREBASE_CLIENT_EMAIL - Firebase client email (alternative format)"
echo "# Format: firebase-adminsdk-xxxxx@project-id.iam.gserviceaccount.com"
vercel env add FIREBASE_CLIENT_EMAIL production
echo ""

echo "# FIREBASE_PRIVATE_KEY - Firebase private key (alternative format)"
echo "# Format: -----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
vercel env add FIREBASE_PRIVATE_KEY production
echo ""

echo "# FIREBASE_STORAGE_BUCKET_UPLOADS - Firebase uploads storage bucket"
echo "# Format: your-project-uploads.appspot.com"
vercel env add FIREBASE_STORAGE_BUCKET_UPLOADS production
echo ""

echo "# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID - Firebase Analytics measurement ID (client-exposed)"
echo "# Format: G-XXXXXXXXXX"
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production
echo ""

echo "# USE_FIREBASE_EMULATOR - Enable Firebase emulator for development"
echo "# Format: true or false"
vercel env add USE_FIREBASE_EMULATOR production
echo ""

# -------------------------------
# Google Services
# -------------------------------
echo "# Google Services"
echo "# ================"

echo "# GOOGLE_MAPS_API_KEY - Google Maps API key (server-side)"
echo "# Format: AIzaSy..."
vercel env add GOOGLE_MAPS_API_KEY production
echo ""

echo "# GOOGLE_SITE_VERIFICATION - Google Search Console verification code"
echo "# Format: verification_code"
vercel env add GOOGLE_SITE_VERIFICATION production
echo ""

echo "# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY - Google Maps API key (client-exposed)"
echo "# Format: AIzaSy..."
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
echo ""

# -------------------------------
# Media & Content
# -------------------------------
echo "# Media & Content"
echo "# ==============="

echo "# NEXT_PUBLIC_RADIO_URL - Radio stream URL for audio player"
echo "# Format: https://stream.example.com/radio.mp3"
vercel env add NEXT_PUBLIC_RADIO_URL production
echo ""

# -------------------------------
# Push Notifications
# -------------------------------
echo "# Push Notifications"
echo "# =================="

echo "# VAPID_PRIVATE_KEY - VAPID private key for push notifications"
echo "# Format: private_key_string"
vercel env add VAPID_PRIVATE_KEY production
echo ""

echo "# VAPID_PUBLIC_KEY - VAPID public key for push notifications"
echo "# Format: public_key_string"
vercel env add VAPID_PUBLIC_KEY production
echo ""

# -------------------------------
# Site Configuration
# -------------------------------
echo "# Site Configuration"
echo "# =================="

echo "# BASE_URL - Base URL for API calls and redirects"
echo "# Format: https://yourdomain.com"
vercel env add BASE_URL production
echo ""

echo "# NEXT_PUBLIC_BASE_URL - Base URL (client-exposed)"
echo "# Format: https://yourdomain.com"
vercel env add NEXT_PUBLIC_BASE_URL production
echo ""

echo "# NEXT_PUBLIC_SITE_URL - Site URL for metadata and SEO"
echo "# Format: https://yourdomain.com"
vercel env add NEXT_PUBLIC_SITE_URL production
echo ""

echo "# SITE_URL - Site URL for server-side operations"
echo "# Format: https://yourdomain.com"
vercel env add SITE_URL production
echo ""

# -------------------------------
# Testing & Development
# -------------------------------
echo "# Testing & Development"
echo "# ====================="

echo "# ADMIN_SETUP_SECRET - Secret for admin setup operations"
echo "# Format: random_secret_string"
vercel env add ADMIN_SETUP_SECRET production
echo ""

echo "# ALLOWED_ADMIN_EMAILS - Alternative admin emails configuration"
echo "# Format: email1@domain.com,email2@domain.com"
vercel env add ALLOWED_ADMIN_EMAILS production
echo ""

echo "# DISABLE_AUTH_FOR_TESTING - Disable authentication for testing"
echo "# Format: true or false"
vercel env add DISABLE_AUTH_FOR_TESTING production
echo ""

echo "# DISABLE_FORCED_REFRESH - Disable forced page refresh on errors"
echo "# Format: true or false"
vercel env add DISABLE_FORCED_REFRESH production
echo ""

echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "After configuring all required variables, trigger a new Production deploy from main branch."
echo ""
echo "To verify your configuration:"
echo "1. Visit https://yourdomain.com/env-check to see client-side variables"
echo "2. Check Vercel dashboard for all environment variables"
echo "3. Test core functionality like authentication and payments"
echo ""
echo "For troubleshooting, refer to:"
echo "- SETUP_GUIDE.md"
echo "- VERCEL_ENV_CHECKLIST.md"
echo "- Error logs in Vercel dashboard"