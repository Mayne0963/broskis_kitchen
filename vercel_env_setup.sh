#!/bin/bash

# Broski Kitchen - Vercel Environment Variables Setup Script
# Run this script to set all required environment variables in Vercel
# NOTE: Replace placeholder values with actual secrets before running

echo "🚀 Setting up Vercel environment variables for Broski Kitchen..."
echo "⚠️  Make sure to replace placeholder values with actual secrets!"
echo ""

# ============================================================================
# SECTION A: SERVER SECRETS (Production Environment)
# ============================================================================

echo "📝 Setting server-side secrets..."

# Authentication & Security
echo "Add NEXTAUTH_SECRET (server-only):"
# vercel env add NEXTAUTH_SECRET production

echo "Add NEXTAUTH_URL (server-only):"
# vercel env add NEXTAUTH_URL production

echo "Add BK_ADMIN_CODE (server-only):"
# vercel env add BK_ADMIN_CODE production

# Stripe Payment Processing
echo "Add STRIPE_SECRET_KEY (server-only):"
# vercel env add STRIPE_SECRET_KEY production

echo "Add STRIPE_WEBHOOK_SECRET (server-only):"
# vercel env add STRIPE_WEBHOOK_SECRET production

# Firebase Admin SDK
echo "Add FIREBASE_ADMIN_PROJECT_ID (server-only):"
# vercel env add FIREBASE_ADMIN_PROJECT_ID production

echo "Add FIREBASE_ADMIN_CLIENT_EMAIL (server-only):"
# vercel env add FIREBASE_ADMIN_CLIENT_EMAIL production

echo "Add FIREBASE_ADMIN_PRIVATE_KEY (server-only):"
# vercel env add FIREBASE_ADMIN_PRIVATE_KEY production

echo "Add FIREBASE_SERVICE_ACCOUNT (server-only):"
# vercel env add FIREBASE_SERVICE_ACCOUNT production

# External Services
echo "Add SENDGRID_API_KEY (server-only):"
# vercel env add SENDGRID_API_KEY production

echo "Add FROM_EMAIL (server-only):"
# vercel env add FROM_EMAIL production

echo "Add RECAPTCHA_V3_SECRET_KEY (server-only):"
# vercel env add RECAPTCHA_V3_SECRET_KEY production

echo "Add GOOGLE_MAPS_API_KEY (server-only):"
# vercel env add GOOGLE_MAPS_API_KEY production

echo "Add VAPID_PRIVATE_KEY (server-only):"
# vercel env add VAPID_PRIVATE_KEY production

# Configuration
echo "Add ADMIN_EMAILS (server-only):"
# vercel env add ADMIN_EMAILS production

echo "Add AGE_VERIFICATION_EXPIRY_DAYS (server-only):"
# vercel env add AGE_VERIFICATION_EXPIRY_DAYS production

# ============================================================================
# SECTION B: PUBLIC CLIENT VARIABLES (Production Environment)
# ============================================================================

echo ""
echo "🌐 Setting client-side public variables..."

# Firebase Client SDK
echo "Add NEXT_PUBLIC_FIREBASE_API_KEY:"
# vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production

echo "Add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:"
# vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production

echo "Add NEXT_PUBLIC_FIREBASE_PROJECT_ID:"
# vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production

echo "Add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:"
# vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production

echo "Add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:"
# vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production

echo "Add NEXT_PUBLIC_FIREBASE_APP_ID:"
# vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

# Payment & Services
echo "Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:"
# vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

echo "Add NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY:"
# vercel env add NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY production

echo "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:"
# vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production

echo "Add NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS:"
# vercel env add NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS production

# Push Notifications
echo "Add VAPID_PUBLIC_KEY:"
# vercel env add VAPID_PUBLIC_KEY production

echo ""
echo "✅ Environment variable setup commands generated!"
echo "📋 Next steps:"
echo "   1. Uncomment the 'vercel env add' commands above"
echo "   2. Replace placeholder values with actual secrets from .env.local"
echo "   3. Run this script or execute commands manually"
echo "   4. Redeploy your application: vercel --prod"
echo "   5. Test with: curl https://YOURDOMAIN/api/env-dump"
echo ""
echo "⚠️  SECURITY REMINDER: Never commit real secrets to version control!"