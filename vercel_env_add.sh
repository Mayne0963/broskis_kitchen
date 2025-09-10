#!/usr/bin/env bash
set -euo pipefail

echo "Vercel Env Add — Missing Keys (Production)"
echo "Make sure you are logged in: vercel login"
echo "Then run each command; paste the secret when prompted."

# -------------------------------
# Add: ADMIN_EMAILS
vercel env add ADMIN_EMAILS production
# -------------------------------
# Add: AGE_VERIFICATION_EXPIRY_DAYS
vercel env add AGE_VERIFICATION_EXPIRY_DAYS production
# -------------------------------
# Add: BK_ADMIN_CODE
vercel env add BK_ADMIN_CODE production
# -------------------------------
# Add: FIREBASE_ADMIN_CLIENT_EMAIL
vercel env add FIREBASE_ADMIN_CLIENT_EMAIL production
# -------------------------------
# Add: FIREBASE_ADMIN_PRIVATE_KEY
vercel env add FIREBASE_ADMIN_PRIVATE_KEY production
# -------------------------------
# Add: FIREBASE_ADMIN_PROJECT_ID
vercel env add FIREBASE_ADMIN_PROJECT_ID production
# -------------------------------
# Add: FIREBASE_API_KEY
vercel env add FIREBASE_API_KEY production
# -------------------------------
# Add: FIREBASE_APP_ID
vercel env add FIREBASE_APP_ID production
# -------------------------------
# Add: FIREBASE_AUTH_DOMAIN
vercel env add FIREBASE_AUTH_DOMAIN production
# -------------------------------
# Add: FIREBASE_MESSAGING_SENDER_ID
vercel env add FIREBASE_MESSAGING_SENDER_ID production
# -------------------------------
# Add: FIREBASE_PROJECT_ID
vercel env add FIREBASE_PROJECT_ID production
# -------------------------------
# Add: FIREBASE_SERVICE_ACCOUNT
vercel env add FIREBASE_SERVICE_ACCOUNT production
# -------------------------------
# Add: FIREBASE_STORAGE_BUCKET
vercel env add FIREBASE_STORAGE_BUCKET production
# -------------------------------
# Add: FROM_EMAIL
vercel env add FROM_EMAIL production
# -------------------------------
# Add: GOOGLE_MAPS_API_KEY
vercel env add GOOGLE_MAPS_API_KEY production
# -------------------------------
# Add: NEXTAUTH_SECRET
vercel env add NEXTAUTH_SECRET production
# -------------------------------
# Add: NEXTAUTH_URL
vercel env add NEXTAUTH_URL production
# -------------------------------
# Add: NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS
vercel env add NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS production
# -------------------------------
# Add: NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# -------------------------------
# Add: NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
# -------------------------------
# Add: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
# -------------------------------
# Add: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
# -------------------------------
# Add: NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
# -------------------------------
# Add: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
# -------------------------------
# Add: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
# -------------------------------
# Add: NEXT_PUBLIC_RECAPTCHA_V3_SECRET_KEY
vercel env add NEXT_PUBLIC_RECAPTCHA_V3_SECRET_KEY production
# -------------------------------
# Add: NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY
vercel env add NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY production
# -------------------------------
# Add: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# -------------------------------
# Add: NODE_ENV
vercel env add NODE_ENV production
# -------------------------------
# Add: RECAPTCHA_V3_SECRET_KEY
vercel env add RECAPTCHA_V3_SECRET_KEY production
# -------------------------------
# Add: RECAPTCHA_V3_SITE_KEY
vercel env add RECAPTCHA_V3_SITE_KEY production
# -------------------------------
# Add: SENDGRID_API_KEY
vercel env add SENDGRID_API_KEY production
# -------------------------------
# Add: STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_PUBLISHABLE_KEY production
# -------------------------------
# Add: STRIPE_SECRET_KEY
vercel env add STRIPE_SECRET_KEY production
# -------------------------------
# Add: STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_WEBHOOK_SECRET production

echo "When finished, trigger a new Production deploy from main."