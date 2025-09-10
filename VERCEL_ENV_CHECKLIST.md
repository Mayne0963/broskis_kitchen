# Broski – Vercel Environment Setup (Production)

## Section A: REQUIRED – SERVER SECRETS (never exposed to client)

**Authentication & Security:**
- `NEXTAUTH_SECRET=` (server-only) - NextAuth session encryption key
- `NEXTAUTH_URL=` (server-only) - NextAuth callback URL
- `BK_ADMIN_CODE=` (server-only) - Admin authentication code

**Stripe Payment Processing:**
- `STRIPE_SECRET_KEY=` (server-only) - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET=` (server-only) - Stripe webhook endpoint secret

**Firebase Admin SDK:**
- `FIREBASE_ADMIN_PROJECT_ID=` (server-only) - Firebase project ID for admin
- `FIREBASE_ADMIN_CLIENT_EMAIL=` (server-only) - Service account email
- `FIREBASE_ADMIN_PRIVATE_KEY=` (server-only) - Service account private key
- `FIREBASE_SERVICE_ACCOUNT=` (server-only) - Complete service account JSON

**External Services:**
- `SENDGRID_API_KEY=` (server-only) - SendGrid email service key
- `FROM_EMAIL=` (server-only) - Default sender email address
- `RECAPTCHA_V3_SECRET_KEY=` (server-only) - reCAPTCHA server-side key
- `GOOGLE_MAPS_API_KEY=` (server-only) - Google Maps API key
- `VAPID_PRIVATE_KEY=` (server-only) - Push notification private key

**Configuration:**
- `ADMIN_EMAILS=` (server-only) - Comma-separated admin email list
- `AGE_VERIFICATION_EXPIRY_DAYS=` (server-only) - Age verification duration

## Section B: REQUIRED – PUBLIC CLIENT VARS (prefixed NEXT_PUBLIC_)

**Firebase Client SDK:**
- `NEXT_PUBLIC_FIREBASE_API_KEY=` (client-exposed)
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=` (client-exposed)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=` (client-exposed)
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=` (client-exposed)
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=` (client-exposed)
- `NEXT_PUBLIC_FIREBASE_APP_ID=` (client-exposed)

**Payment & Services:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=` (client-exposed)
- `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=` (client-exposed)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=` (client-exposed)
- `NEXT_PUBLIC_AGE_VERIFICATION_EXPIRY_DAYS=` (client-exposed)

**Push Notifications:**
- `VAPID_PUBLIC_KEY=` (client-exposed)

## Section C: OPTIONAL / ANALYTICS

**Legacy/Duplicate Variables (may not be needed):**
- `STRIPE_PUBLISHABLE_KEY=` (duplicate of NEXT_PUBLIC version)
- `RECAPTCHA_V3_SITE_KEY=` (duplicate of NEXT_PUBLIC version)
- `FIREBASE_API_KEY=` (duplicate of NEXT_PUBLIC version)
- `FIREBASE_AUTH_DOMAIN=` (duplicate of NEXT_PUBLIC version)
- `FIREBASE_PROJECT_ID=` (duplicate of NEXT_PUBLIC version)
- `FIREBASE_STORAGE_BUCKET=` (duplicate of NEXT_PUBLIC version)
- `FIREBASE_MESSAGING_SENDER_ID=` (duplicate of NEXT_PUBLIC version)
- `FIREBASE_APP_ID=` (duplicate of NEXT_PUBLIC version)

**System Variables (auto-set by Vercel):**
- `VERCEL=` (auto-set)
- `VERCEL_ENV=` (auto-set)
- `VERCEL_REGION=` (auto-set)
- `VERCEL_URL=` (auto-set)
- `NODE_ENV=` (auto-set)

## Steps to Set in Vercel Dashboard

1. **Navigate to Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables

2. **Add Server Secrets (Section A):**
   - Set each variable for `Production` environment
   - Optionally add to `Preview` for staging tests
   - **CRITICAL:** Never expose these in client code

3. **Add Client Variables (Section B):**
   - Set each NEXT_PUBLIC_ variable for `Production`
   - These will be bundled into client JavaScript

4. **Skip Optional Variables (Section C):**
   - Vercel auto-sets system variables
   - Remove duplicate non-NEXT_PUBLIC versions if present

## After-Deploy Verification Steps

1. **Health Check:**
   ```bash
   curl -s https://YOURDOMAIN/admin/health
   ```

2. **Admin Login Test:**
   - Visit https://YOURDOMAIN/admin
   - Test authentication flow

3. **Environment Dump Check:**
   ```bash
   curl -s https://YOURDOMAIN/api/env-dump | jq '.variables'
   ```

4. **Payment Flow Test:**
   - Test Stripe integration
   - Verify webhook endpoints

## Important Notes

- **Security:** Ensure `.env.local` is in `.gitignore` - never commit secrets to git
- **Redeploy:** After setting environment variables, trigger a new deployment
- **Monitoring:** Use the `/api/env-dump` endpoint to verify variable availability
- **Duplicates:** Remove non-NEXT_PUBLIC duplicates to avoid confusion
- **Firebase:** Both client SDK and Admin SDK variables are required for full functionality