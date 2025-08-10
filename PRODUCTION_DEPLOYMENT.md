# Production Deployment Guide

This guide covers the complete setup and deployment process for Broski's Kitchen production environment.

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.production` and update all placeholder values
- [ ] Set up production Firebase project
- [ ] Configure production Stripe account
- [ ] Set up production Google Maps API key
- [ ] Configure OnTheWay production API
- [ ] Set up monitoring services (Sentry, DataDog, etc.)

### 2. Security Configuration
- [ ] Generate secure `NEXTAUTH_SECRET`
- [ ] Set up strong `ENCRYPTION_KEY`
- [ ] Configure CORS policies
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Configure SSL certificates

### 3. Database Setup
- [ ] Set up production Firebase Firestore
- [ ] Configure security rules
- [ ] Set up backup policies
- [ ] Configure indexes for performance

### 4. Payment System
- [ ] Test Stripe integration in production
- [ ] Verify webhook endpoints
- [ ] Test Apple Pay configuration
- [ ] Test CashApp integration
- [ ] Verify refund processes

### 5. Monitoring & Logging
- [ ] Verify logging service configuration
- [ ] Set up error tracking
- [ ] Configure performance monitoring
- [ ] Set up alerting rules
- [ ] Test monitoring dashboard

## Deployment Steps

### 1. Build Verification
```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Start production server locally for testing
npm start
```

### 2. Vercel Deployment

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Option B: GitHub Integration
1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy from main branch

### 3. Environment Variables Setup

In Vercel dashboard, add all environment variables from `.env.production`:

#### Required Variables
- `NODE_ENV=production`
- `NEXT_PUBLIC_FIREBASE_*` (all Firebase config)
- `FIREBASE_ADMIN_*` (Firebase Admin SDK)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `OTW_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

#### Optional but Recommended
- `SENTRY_DSN`
- `DATADOG_API_KEY`
- `SMTP_*` (email configuration)
- `TWILIO_*` (SMS configuration)

### 4. Domain Configuration

1. Add custom domain in Vercel dashboard
2. Configure DNS records:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```
3. Enable SSL (automatic with Vercel)

### 5. Firebase Security Rules

Update Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders collection
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
      allow read: if resource.data.contactInfo.email == request.auth.token.email;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin access
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

### 6. Stripe Webhook Configuration

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.dispute.created`
4. Copy webhook secret to environment variables

### 7. OnTheWay Integration

1. Configure webhook URL: `https://yourdomain.com/api/otw/webhook`
2. Update API endpoints to production URLs
3. Test delivery tracking integration

## Post-Deployment Verification

### 1. Functionality Tests
- [ ] User registration/login
- [ ] Menu browsing
- [ ] Order placement
- [ ] Payment processing
- [ ] Order tracking
- [ ] Admin dashboard
- [ ] Monitoring dashboard

### 2. Performance Tests
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] Image optimization working
- [ ] CDN configuration

### 3. Security Tests
- [ ] HTTPS enforcement
- [ ] Security headers present
- [ ] Rate limiting functional
- [ ] Authentication working
- [ ] Authorization rules enforced

### 4. Monitoring Verification
- [ ] Error tracking active
- [ ] Performance monitoring working
- [ ] Log aggregation functional
- [ ] Alert rules configured
- [ ] Dashboard accessible

## Monitoring & Maintenance

### Daily Checks
- Monitor error rates
- Check performance metrics
- Review security alerts
- Verify payment processing

### Weekly Tasks
- Review log analytics
- Check system health
- Update dependencies
- Performance optimization

### Monthly Tasks
- Security audit
- Backup verification
- Cost optimization
- Feature usage analysis

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

#### Environment Variable Issues
- Verify all required variables are set
- Check for typos in variable names
- Ensure sensitive values are properly escaped

#### Database Connection Issues
- Verify Firebase configuration
- Check security rules
- Validate API keys

#### Payment Issues
- Verify Stripe keys (test vs production)
- Check webhook configuration
- Validate SSL certificates

### Support Contacts
- Vercel Support: support@vercel.com
- Firebase Support: firebase-support@google.com
- Stripe Support: support@stripe.com

## Rollback Procedure

1. Identify the last known good deployment
2. Revert to previous version in Vercel dashboard
3. Verify functionality
4. Investigate and fix issues
5. Redeploy when ready

## Security Considerations

- Never commit sensitive environment variables
- Regularly rotate API keys and secrets
- Monitor for suspicious activity
- Keep dependencies updated
- Regular security audits
- Implement proper logging and monitoring

## Performance Optimization

- Enable Vercel Analytics
- Use Next.js Image optimization
- Implement proper caching strategies
- Monitor Core Web Vitals
- Optimize bundle size
- Use CDN for static assets

---

**Note**: This deployment guide should be customized based on your specific requirements and infrastructure setup.