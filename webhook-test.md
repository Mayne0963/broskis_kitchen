# Stripe Webhook Implementation Test Guide

## Environment Setup

Ensure the following environment variables are configured:

```bash
# Required for webhook functionality
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_... # from Stripe webhook endpoint

# Firebase Admin (should already be configured)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

## Local Testing with Stripe CLI

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login to Stripe: `stripe login`
3. Forward webhooks to local development:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Use the webhook signing secret provided by the CLI in your `.env.local`

## Test Scenarios

### 1. Checkout Session Completed
```bash
# Trigger a test checkout.session.completed event
stripe trigger checkout.session.completed
```

### 2. Payment Intent Succeeded
```bash
# Trigger a test payment_intent.succeeded event
stripe trigger payment_intent.succeeded
```

## Expected Results

After triggering webhook events, verify:

1. **Webhook Response**: Returns 200 with `{"ok": true, "orderId": "order_...", "message": "Order created successfully"}`

2. **Firestore Collections**:
   - `orders/{orderId}` - Contains the complete order document
   - `users/{uid}/orders/{orderId}` - Contains order copy if user was linked
   - `stripeEvents/{eventId}` - Contains processing marker for idempotency
   - `errorLogs` - Should remain empty (no errors)

3. **Admin Dashboard**: 
   - Navigate to `/admin/dashboard`
   - New orders should appear immediately without refresh
   - Orders should show correct status, email, total, and items

4. **Idempotency Test**:
   - Re-send the same webhook event
   - Should return 200 with "Event already processed" message
   - Should NOT create duplicate orders

## Order Structure Validation

Each created order should contain:
```typescript
{
  id: "order_1234567890_abc123",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  status: "paid",
  userId: "firebase-uid" | null,
  userEmail: "customer@example.com",
  userName: "Customer Name" | null,
  items: [{
    name: "Product Name",
    quantity: 1,
    priceCents: 1000
  }],
  subtotalCents: 1000,
  taxCents: 80,
  totalCents: 1080,
  currency: "usd",
  isTest: true, // or false for live mode
  stripePaymentIntentId: "pi_...",
  stripeSessionId: "cs_..." | null,
  stripeCustomerId: "cus_...",
  address: { /* address object */ } | null,
  metadata: {
    stripeEventId: "evt_...",
    stripeSessionId: "cs_...",
    stripeLiveMode: false
  }
}
```

## Production Testing

1. Configure live Stripe keys in production environment
2. Set up webhook endpoint in Stripe Dashboard pointing to your production URL
3. Process a small test payment ($0.50)
4. Verify order appears in admin dashboard
5. Check that customer receives proper receipt

## Troubleshooting

- **400 Invalid Signature**: Check webhook secret configuration
- **500 Internal Error**: Check error logs in Firestore `errorLogs` collection
- **Orders not appearing**: Verify admin API cache settings and Firestore permissions
- **Duplicate orders**: Check `stripeEvents` collection for proper idempotency markers

## Security Notes

- Webhook signature verification prevents unauthorized requests
- All errors are logged to Firestore for audit trail
- User linking is done securely via Firebase Auth email lookup
- Transaction safety prevents race conditions and duplicate processing