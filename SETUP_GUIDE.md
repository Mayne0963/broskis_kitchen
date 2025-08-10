# Broski's Kitchen - Complete Setup Guide

This guide will walk you through setting up the complete Broski's Kitchen application, including Firebase, payment processing, and all required services.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Firebase Configuration](#firebase-configuration)
4. [Environment Variables](#environment-variables)
5. [Payment Integration](#payment-integration)
6. [Email Services](#email-services)
7. [Maps Integration](#maps-integration)
8. [Development Setup](#development-setup)
9. [Production Deployment](#production-deployment)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- npm or pnpm package manager
- Git for version control
- A Firebase account
- A Stripe account (for payments)
- A Google Cloud account (for Maps API)

## Project Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd broskis-kitchen

# Install dependencies
npm install
# or
pnpm install
```

### 2. Project Structure

```
broskis-kitchen/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── public/
│   ├── images/             # Static images
│   └── icons/              # App icons
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── api-keys-template.md    # API keys template
```

## Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "broskis-kitchen"
4. Enable Google Analytics (recommended)
5. Choose or create Analytics account

### 2. Enable Firebase Services

#### Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password
3. Enable Google (optional)
4. Configure authorized domains

#### Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Start in test mode (we'll deploy security rules later)
4. Choose location closest to your users

#### Storage
1. Go to Storage
2. Click "Get started"
3. Start in test mode
4. Choose same location as Firestore

#### Hosting (Optional)
1. Go to Hosting
2. Click "Get started"
3. Follow setup instructions

### 3. Get Firebase Configuration

1. Go to Project Settings > General
2. Scroll to "Your apps"
3. Click "Add app" > Web
4. Register app with nickname "broskis-kitchen-web"
5. Copy the configuration object

### 4. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Deploy security rules
firebase deploy --only firestore:rules,storage
```

## Environment Variables

### 1. Create Environment Files

Create `.env.local` for development:

```bash
cp api-keys-template.md .env.local
```

Edit `.env.local` with your actual values:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Other services...
```

### 2. Production Environment

For production, use your hosting platform's environment variable settings:

- **Vercel**: Project Settings > Environment Variables
- **Netlify**: Site Settings > Environment Variables
- **Railway**: Project Settings > Variables

## Payment Integration

### 1. Stripe Setup

1. Create [Stripe account](https://stripe.com)
2. Get API keys from Dashboard > Developers > API keys
3. Set up webhooks:
   - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 2. Test Payment Flow

```bash
# Start development server
npm run dev

# Use Stripe test cards
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
```

## Email Services

### Option 1: SendGrid

1. Create [SendGrid account](https://sendgrid.com)
2. Create API key
3. Verify sender identity
4. Add to environment variables

### Option 2: Resend

1. Create [Resend account](https://resend.com)
2. Create API key
3. Add domain (for production)
4. Add to environment variables

## Maps Integration

### 1. Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Maps JavaScript API
4. Create API key
5. Restrict API key to your domains

### 2. Configure Maps

Add to environment variables:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

## Development Setup

### 1. Start Development Server

```bash
# Start Next.js development server
npm run dev

# Start Firebase emulators (optional)
firebase emulators:start
```

### 2. Development Tools

- **Firebase Emulator Suite**: Local Firebase services
- **Stripe CLI**: Local webhook testing
- **React Developer Tools**: Browser extension
- **Redux DevTools**: State management debugging

### 3. Code Quality

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test

# Format code
npm run format
```

## Production Deployment

### 1. Build and Test

```bash
# Build for production
npm run build

# Test production build locally
npm start
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add
```

### 3. Deploy Firebase Rules

```bash
# Deploy to production
firebase deploy --project production
```

### 4. Configure Custom Domain

1. Add domain in Vercel dashboard
2. Update DNS records
3. Update Firebase authorized domains
4. Update Stripe webhook endpoints

## Testing

### 1. Unit Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage
```

### 2. Integration Tests

```bash
# Start emulators
firebase emulators:start

# Run integration tests
npm run test:integration
```

### 3. E2E Tests

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e
```

### 4. Manual Testing Checklist

- [ ] User registration and login
- [ ] Menu browsing and filtering
- [ ] Add items to cart
- [ ] Checkout process
- [ ] Payment processing
- [ ] Order confirmation
- [ ] Admin dashboard access
- [ ] Mobile responsiveness

## Troubleshooting

### Common Issues

#### Firebase Connection Issues
```bash
# Check Firebase configuration
npm run firebase:check

# Test Firestore connection
npm run test:firestore
```

#### Build Errors
```bash
# Clear Next.js cache
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variable Issues
```bash
# Verify environment variables
npm run env:check

# Show current environment
echo $NODE_ENV
```

### Performance Optimization

1. **Image Optimization**
   - Use Next.js Image component
   - Optimize images before upload
   - Use WebP format when possible

2. **Code Splitting**
   - Lazy load components
   - Use dynamic imports
   - Optimize bundle size

3. **Caching**
   - Configure CDN caching
   - Use React Query for data caching
   - Implement service worker

### Security Checklist

- [ ] Environment variables secured
- [ ] Firebase security rules deployed
- [ ] API keys restricted to domains
- [ ] HTTPS enabled
- [ ] Content Security Policy configured
- [ ] Rate limiting implemented

## Support

For help with setup:

1. Check this documentation
2. Review error logs
3. Check Firebase Console
4. Contact development team

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintained By**: Broski's Kitchen Development Team