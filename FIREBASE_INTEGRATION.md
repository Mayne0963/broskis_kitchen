# Firebase Integration for bosk's Kitchen Ordering System

This document outlines the Firebase integration implemented for the ordering system, including setup instructions and configuration details.

## Overview

The ordering system is fully integrated with Firebase Firestore for data persistence and Stripe for payment processing. The system includes:

- **Order Management**: Create, read, update, and delete orders
- **Payment Processing**: Stripe integration with webhook handling
- **Real-time Updates**: Order status tracking
- **Fallback Support**: Local storage fallback when Firebase is unavailable

## Firebase Configuration

### Environment Variables

The following environment variables must be set in Vercel (or your deployment platform):

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Stripe Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Firestore Database

2. **Configure Firestore**:
   - Create a `orders` collection
   - Set up security rules (see below)

3. **Get Configuration**:
   - Go to Project Settings > General
   - Add a web app if not already done
   - Copy the configuration values

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders collection
    match /orders/{orderId} {
      // Allow read/write for authenticated users
      allow read, write: if request.auth != null;
      // Allow read for order owner (using userId field)
      allow read: if resource.data.userId == request.auth.uid;
    }
    
    // Verifications collection
    match /verifications/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Each verification document includes:
    // {
    //   isVerified: boolean,
    //   timestamp: timestamp,
    //   expiryDate: timestamp
    // }
    
    // Coupons collection
    match /coupons/{couponId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Adjust based on your needs
    }
  }
}
```

## Stripe Integration

### Setup

1. **Create Stripe Account**:
   - Sign up at [Stripe Dashboard](https://dashboard.stripe.com/)
   - Get your API keys from the Developers section

2. **Configure Webhooks**:
   - Go to Developers > Webhooks in Stripe Dashboard
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
   - Copy the webhook signing secret

### Payment Flow

1. **Order Creation**:
   - User fills out checkout form
   - Order is created in Firebase with `pending` status
   - Payment intent is created with order metadata

2. **Payment Processing**:
   - Stripe handles payment collection
   - Webhook receives payment events
   - Order status is updated based on payment result

3. **Order Fulfillment**:
   - Confirmed orders are processed
   - Status updates are tracked in Firebase

## API Endpoints

### Orders API (`/api/orders`)

- **GET**: Retrieve orders
  - Query params: `userId`, `orderId`
- **POST**: Create new order
- **PUT**: Update order status
- **DELETE**: Cancel order

### Stripe API

- **POST `/api/stripe/create-payment-intent`**: Create payment intent
- **POST `/api/stripe/confirm-payment`**: Confirm payment status
- **POST `/api/stripe/webhook`**: Handle Stripe webhooks

## Order Status Flow

```
pending → confirmed → preparing → ready → out-for-delivery → delivered → completed
                                     ↓
                                  cancelled
```

### Status Descriptions

- **pending**: Order created, payment processing
- **confirmed**: Payment successful, order confirmed
- **preparing**: Kitchen is preparing the order
- **ready**: Order ready for pickup/delivery
- **out-for-delivery**: Order is being delivered
- **delivered**: Order delivered to customer
- **completed**: Order fully completed
- **cancelled**: Order cancelled

## Data Models

### Order Document Structure

```typescript
interface Order {
  id: string
  userId?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
  status: OrderStatus
  orderType: 'delivery' | 'pickup'
  deliveryAddress?: DeliveryAddress
  pickupLocation?: string
  contactInfo: {
    email: string
    phone: string
  }
  paymentInfo?: PaymentInfo
  specialInstructions?: string
  estimatedTime?: string
  createdAt: Date
  updatedAt: Date
  paymentStatus?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  stripePaymentIntentId?: string
  otwOrderId?: string // For delivery tracking integration
}
```

## Error Handling

### Firebase Fallback

If Firebase is not configured or unavailable:
- Orders are stored in localStorage
- Basic functionality is maintained
- Data is not persisted across sessions

### Payment Error Handling

- Failed payments automatically cancel orders
- Users receive appropriate error messages
- Retry mechanisms are in place

## Testing

### Local Development

1. Set up environment variables in `.env.local`
2. Use Stripe test keys for development
3. Configure Firebase for development environment

### Stripe Testing

Use Stripe test card numbers:
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Requires authentication: `4000002500003155`

## Deployment Checklist

- [ ] Firebase project created and configured
- [ ] Firestore security rules set up
- [ ] Environment variables configured in Vercel
- [ ] Stripe webhooks configured
- [ ] Test orders working end-to-end
- [ ] Payment processing tested
- [ ] Error handling verified

## Monitoring

### Firebase Console
- Monitor Firestore usage and performance
- Check security rule violations
- Review authentication logs

### Stripe Dashboard
- Monitor payment success rates
- Check webhook delivery status
- Review failed payments

## Support

For issues with the Firebase integration:
1. Check environment variables are correctly set
2. Verify Firebase project configuration
3. Review Firestore security rules
4. Check Stripe webhook configuration
5. Monitor browser console for errors

## Future Enhancements

- Real-time order tracking with Firebase Realtime Database
- Push notifications for order updates
- Advanced analytics with Firebase Analytics
- Customer authentication with Firebase Auth
- Image storage with Firebase Storage