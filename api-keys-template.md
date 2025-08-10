# 🔑 API Keys Template

This file contains templates and examples for all the API keys and environment variables needed for the Broski's Kitchen application.

## 📋 Quick Setup Checklist

- [ ] Copy `.env.local.template` to `.env.local`
- [ ] Fill in all required API keys
- [ ] Test each integration
- [ ] Secure your keys (never commit to Git)

---

## 🔥 Firebase Configuration

### Environment Variables
```javascript
// Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

// Firebase Admin Configuration (Private)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

### Where to Get Firebase Keys
1. **Firebase Console**: https://console.firebase.google.com
2. **Project Settings** → **General** → **Your apps**
3. **Service Accounts** → **Generate new private key**

---

## 💳 Stripe Configuration

### API Keys
```javascript
// Environment Variables
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Webhook Configuration
```javascript
// File: pages/api/webhooks/stripe.ts
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Webhook Events to Listen For:
const relevantEvents = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
];
```

### Where to Get Stripe Keys
1. **Stripe Dashboard**: https://dashboard.stripe.com
2. **Developers** → **API keys**
3. **Webhooks** → **Add endpoint**

---

## 🗺️ Google Maps Configuration

### API Key
```javascript
// Environment Variable
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

// Usage in Components
// File: components/maps/DeliveryMap.tsx
const { isLoaded } = useJsApiLoader({
  id: 'google-map-script',
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  libraries: ['places', 'geometry']
});
```

### Required APIs to Enable
- Maps JavaScript API
- Places API
- Geocoding API
- Distance Matrix API
- Directions API

### Where to Get Google Maps Keys
1. **Google Cloud Console**: https://console.cloud.google.com
2. **APIs & Services** → **Credentials**
3. **Create Credentials** → **API Key**

---

## 🤖 OpenAI Configuration

### API Key
```javascript
// Environment Variable
OPENAI_API_KEY=sk-your_openai_api_key_here

// Usage Example
// File: lib/ai/recommendations.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Example: Menu Recommendations
const generateRecommendations = async (userPreferences: string[]) => {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful restaurant assistant that recommends menu items based on user preferences."
      },
      {
        role: "user",
        content: `Recommend menu items for someone who likes: ${userPreferences.join(', ')}`
      }
    ],
    model: "gpt-3.5-turbo",
  });
  
  return completion.choices[0].message.content;
};
```

### Where to Get OpenAI Keys
1. **OpenAI Platform**: https://platform.openai.com
2. **API Keys** → **Create new secret key**

---

## 📧 Email Service Configuration

### SendGrid (Recommended)
```javascript
// Environment Variables
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=noreply@broskiskitchen.com

// Usage Example
// File: lib/email/sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const sendOrderConfirmation = async (to: string, orderDetails: any) => {
  const msg = {
    to,
    from: process.env.FROM_EMAIL!,
    subject: 'Order Confirmation - Broski\'s Kitchen',
    templateId: 'd-your_template_id_here', // Your template ID
    dynamicTemplateData: {
      orderNumber: orderDetails.orderNumber,
      items: orderDetails.items,
      total: orderDetails.total
    }
  };
  
  await sgMail.send(msg);
};
```

### Alternative: Resend
```javascript
// Environment Variable
RESEND_API_KEY=re_your_resend_api_key_here

// Usage
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
```

---

## 🔐 NextAuth Configuration

### Secret and URL
```javascript
// Environment Variables
NEXTAUTH_SECRET=your-nextauth-secret-here-generate-random-string
NEXTAUTH_URL=http://localhost:3000 // or your production URL

// File: pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { FirestoreAdapter } from '@next-auth/firebase-adapter';

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  adapter: FirestoreAdapter({
    // Firebase config
  }),
});
```

---

## 📱 Push Notifications (Firebase Cloud Messaging)

### Configuration
```javascript
// File: lib/firebase/messaging.ts
import { getMessaging, getToken } from 'firebase/messaging';

// Vapid Key (from Firebase Console)
const vapidKey = "your_vapid_key_here";

const messaging = getMessaging();

const getNotificationToken = async () => {
  const token = await getToken(messaging, {
    vapidKey: vapidKey
  });
  return token;
};
```

### Service Worker
```javascript
// File: public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  // Your config
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background Message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/images/broskis-logo.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

---

## 🔒 Security Best Practices

### Environment Variables
1. **Never commit `.env.local` to Git**
2. **Use different keys for development and production**
3. **Rotate keys regularly**
4. **Restrict API key permissions**
5. **Monitor API usage**

### Firebase Security
1. **Enable App Check**
2. **Configure Security Rules**
3. **Use Firebase Admin SDK server-side only**
4. **Enable audit logs**

### Stripe Security
1. **Use webhook signatures**
2. **Validate all payments server-side**
3. **Never store card details**
4. **Use HTTPS only**

---

## 🚀 Deployment Checklist

### Vercel Deployment
1. **Add all environment variables in Vercel dashboard**
2. **Test all integrations in preview deployments**
3. **Update NEXTAUTH_URL for production**
4. **Configure custom domain**
5. **Set up monitoring and alerts**

### Production Environment Variables
```javascript
// Update these for production
NEXTAUTH_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
```

---

## 📞 Support Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Stripe Documentation**: https://stripe.com/docs
- **Google Maps Documentation**: https://developers.google.com/maps
- **NextAuth Documentation**: https://next-auth.js.org
- **OpenAI Documentation**: https://platform.openai.com/docs

---

## 🐛 Troubleshooting

### Common Issues

#### Firebase Connection
```bash
# Test Firebase connection
npm run firebase:test
```

#### Stripe Webhooks
```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### Environment Variables
```bash
# Check if variables are loaded
console.log('Environment check:', {
  firebase: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  stripe: !!process.env.STRIPE_SECRET_KEY,
  maps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
});
```