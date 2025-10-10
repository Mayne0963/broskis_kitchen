# Broski's Kitchen Rewards MVP - Deployment Guide

## 1. Deployment Overview

This guide provides step-by-step instructions for deploying the Broski's Kitchen Rewards MVP to production. The system uses Firebase for backend services and Vercel for frontend hosting, ensuring scalability and reliability.

### 1.1 Architecture Summary

* **Frontend**: Next.js 14 deployed on Vercel

* **Backend**: Firebase Functions (Node.js 18)

* **Database**: Firestore with security rules

* **Authentication**: NextAuth.js with Firebase Admin

* **CDN**: Vercel Edge Network

### 1.2 Prerequisites

* Firebase project with Blaze plan (required for Functions)

* Vercel account with team access

* Node.js 18+ installed locally

* Firebase CLI installed (`npm install -g firebase-tools`)

* Vercel CLI installed (`npm install -g vercel`)

## 2. Firebase Setup & Deployment

### 2.1 Firebase Project Configuration

**Step 1: Initialize Firebase Project**

```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init

# Select the following services:
# ✓ Firestore: Configure security rules and indexes
# ✓ Functions: Configure a Cloud Functions directory
# ✓ Hosting: Configure files for Firebase Hosting
```

**Step 2: Configure Firebase Functions**

Create `functions/package.json`:

```json
{
  "name": "broski-rewards-functions",
  "version": "1.0.0",
  "description": "Broski's Kitchen Rewards System Functions",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^18.0.0"
  }
}
```

**Step 3: Deploy Firebase Functions**

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 2.2 Firestore Security Rules Deployment

**Deploy Security Rules**:

```bash
firebase deploy --only firestore:rules
```

**Deploy Firestore Indexes**:

```bash
firebase deploy --only firestore:indexes
```

### 2.3 Firebase Environment Configuration

**Set Firebase Function Environment Variables**:

```bash
# Stripe configuration
firebase functions:config:set stripe.secret_key="sk_live_your_stripe_key"
firebase functions:config:set stripe.webhook_secret="whsec_your_webhook_secret"

# Rewards configuration
firebase functions:config:set rewards.signup_bonus="100"
firebase functions:config:set rewards.birthday_bonus="250"
firebase functions:config:set rewards.referral_bonus="300"

# Email configuration (if using)
firebase functions:config:set email.api_key="your_email_api_key"
firebase functions:config:set email.from="rewards@broskiskitchen.com"
```

## 3. Vercel Deployment

### 3.1 Environment Variables Setup

**Required Environment Variables for Vercel**:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=broskis-kitchen-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@broskis-kitchen-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# NextAuth Configuration
NEXTAUTH_URL=https://broskiskitchen.com
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Stripe Integration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Rewards Configuration
REWARDS_SIGNUP_BONUS=100
REWARDS_BIRTHDAY_BONUS=250
REWARDS_REFERRAL_BONUS=300
```

**Set Environment Variables via Vercel CLI**:

```bash
# Production environment
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_CLIENT_EMAIL production
vercel env add FIREBASE_PRIVATE_KEY production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production

# Preview environment (optional)
vercel env add FIREBASE_PROJECT_ID preview
# ... repeat for other variables
```

### 3.2 Vercel Configuration

**vercel.json**:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/rewards/:path*",
      "destination": "/rewards/:path*"
    }
  ]
}
```

### 3.3 Deploy to Vercel

**Initial Deployment**:

```bash
# Link project to Vercel
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Automated Deployment via GitHub**:

1. Connect repository to Vercel
2. Configure build settings:

   * Framework: Next.js

   * Build Command: `npm run build`

   * Output Directory: `.next`

   * Install Command: `npm install`

## 4. Database Migration & Initialization

### 4.1 Initial Data Setup

**Create Admin User Script** (`scripts/setup-admin.js`):

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setupAdmin() {
  const adminEmail = 'admin@broskiskitchen.com';
  
  try {
    // Create admin user
    const userRecord = await admin.auth().createUser({
      email: adminEmail,
      password: 'secure-admin-password',
      displayName: 'Broski Admin'
    });
    
    // Set admin custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'admin'
    });
    
    console.log('Admin user created:', userRecord.uid);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

setupAdmin();
```

**Run Setup Script**:

```bash
node scripts/setup-admin.js
```

### 4.2 Firestore Indexes

**firestore.indexes.json**:

```json
{
  "indexes": [
    {
      "collectionGroup": "rewards_ledger",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "uid",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "redemptions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "uid",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "issuedAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "redemptions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "couponCode",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "admin_actions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "adminUid",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## 5. Monitoring & Analytics Setup

### 5.1 Firebase Analytics Configuration

**Enable Firebase Analytics**:

```bash
firebase init analytics
firebase deploy --only analytics
```

**Custom Events Tracking**:

```javascript
// In your Next.js app
import { analytics } from '@/lib/firebase/client';
import { logEvent } from 'firebase/analytics';

// Track reward redemptions
logEvent(analytics, 'reward_redeemed', {
  points_spent: 1000,
  reward_type: 'discount',
  user_tier: 'silver'
});

// Track referral conversions
logEvent(analytics, 'referral_converted', {
  referrer_id: 'user_123',
  bonus_points: 300
});
```

### 5.2 Error Monitoring

**Sentry Integration** (optional):

```bash
npm install @sentry/nextjs
```

**sentry.client.config.js**:

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### 5.3 Performance Monitoring

**Vercel Analytics**:

```bash
npm install @vercel/analytics
```

**Add to layout.tsx**:

```javascript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## 6. Testing & Validation

### 6.1 Pre-Deployment Testing

**Test Checklist**:

* [ ] User registration and login

* [ ] Points earning on signup

* [ ] Points redemption flow

* [ ] Admin point adjustments

* [ ] Referral code generation

* [ ] Birthday bonus (manual trigger)

* [ ] Coupon code validation

* [ ] Security rules enforcement

**Test Script** (`scripts/test-rewards.js`):

```javascript
const { execSync } = require('child_process');

async function runTests() {
  console.log('Testing rewards system...');
  
  // Test API endpoints
  const tests = [
    'curl -X GET https://broskiskitchen.com/api/rewards/me',
    'curl -X POST https://broskiskitchen.com/api/rewards/redeem -d \'{"points":1000}\'',
    'curl -X GET https://broskiskitchen.com/api/rewards/admin/analytics'
  ];
  
  for (const test of tests) {
    try {
      console.log(`Running: ${test}`);
      const result = execSync(test, { encoding: 'utf8' });
      console.log('✓ Passed');
    } catch (error) {
      console.log('✗ Failed:', error.message);
    }
  }
}

runTests();
```

### 6.2 Load Testing

**Artillery Configuration** (`artillery.yml`):

```yaml
config:
  target: 'https://broskiskitchen.com'
  phases:
    - duration: 60
      arrivalRate: 10
  headers:
    Cookie: 'next-auth.session-token=test-token'

scenarios:
  - name: 'Rewards API Load Test'
    requests:
      - get:
          url: '/api/rewards/me'
      - post:
          url: '/api/rewards/redeem'
          json:
            points: 1000
```

**Run Load Test**:

```bash
npm install -g artillery
artillery run artillery.yml
```

## 7. Post-Deployment Checklist

### 7.1 Immediate Verification

* [ ] All API endpoints responding correctly

* [ ] Firebase Functions deployed and accessible

* [ ] Firestore security rules active

* [ ] Environment variables configured

* [ ] SSL certificates valid

* [ ] CDN caching working

### 7.2 Functional Testing

* [ ] User registration creates rewards profile

* [ ] Points earning works correctly

* [ ] Tier calculations accurate

* [ ] Redemption flow complete

* [ ] Admin dashboard accessible

* [ ] Referral tracking functional

### 7.3 Performance Verification

* [ ] Page load times < 3 seconds

* [ ] API response times < 500ms

* [ ] Database queries optimized

* [ ] Caching strategies effective

### 7.4 Security Validation

* [ ] Authentication required for protected routes

* [ ] Admin-only endpoints secured

* [ ] Input validation working

* [ ] Rate limiting active

* [ ] HTTPS enforced

## 8. Maintenance & Updates

### 8.1 Regular Maintenance Tasks

**Weekly**:

* Monitor error rates and performance metrics

* Review audit logs for suspicious activity

* Check Firebase usage and billing

**Monthly**:

* Update dependencies and security patches

* Review and optimize database queries

* Analyze rewards system metrics

**Quarterly**:

* Security audit and penetration testing

* Performance optimization review

* Feature usage analysis

### 8.2 Update Deployment Process

**For Code Updates**:

```bash
# 1. Test locally
npm run dev
npm run test

# 2. Deploy to preview
vercel

# 3. Test preview environment
npm run test:e2e

# 4. Deploy to production
vercel --prod

# 5. Verify production deployment
npm run test:production
```

**For Firebase Functions Updates**:

```bash
cd functions
npm run build
firebase deploy --only functions
```

This deployment guide ensures a smooth, secure, and scalable deployment of the Broski's Kitchen Rewards MVP system.
