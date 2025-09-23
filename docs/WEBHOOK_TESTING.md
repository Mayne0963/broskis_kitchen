# Webhook Testing (Local)

## Prereqs
- `stripe` CLI installed and logged in: `https://docs.stripe.com/stripe-cli`
- `STRIPE_SECRET_KEY` (test) set in `.env.local`
- `STRIPE_WEBHOOK_SECRET` is not required for local when using `stripe listen` (it injects a signing secret into STRIPE_WEBHOOK_SECRET automatically in the process env); if our webhook verifies signatures, export the secret value printed by `stripe listen`.

## Quick Test Steps
1) Start dev server
   ```
   npm run dev
   ```

2) Start stripe listener (new terminal)
   ```
   npm run stripe:listen
   ```
   # Copy the "Signing secret" it prints if our webhook requires it.
   # Optional: export STRIPE_WEBHOOK_SECRET=<secret> in the same shell that runs `next dev`.

3) Trigger a test event (another terminal)
   ```
   npm run stripe:trigger
   ```

4) Verify
   - GET http://localhost:3000/api/stripe/health -> all flags "true" except webhookSecret if not exported
   - GET http://localhost:3000/api/dev/orders-dump?limit=5 -> should show a new order with status 'paid'

## Local Testing & Debugging

### Complete Flow Testing
To verify the entire Stripe → Webhook → Firestore → Admin dashboard flow:

1. **Start Development Server**
   ```bash
   vercel dev
   # OR
   npm run dev
   ```

2. **Start Stripe Webhook Listener** (new terminal)
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Note the webhook signing secret printed in the output.

3. **Create Test Checkout Session**
   - Navigate to your app's checkout flow
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete the payment process

4. **Verify Console Logs**
   Check your dev server terminal for these log messages:
   ```
   Received Stripe event checkout.session.completed evt_xxxxx
   Order upserted order_cs_xxxxx
   ```

5. **Check Debug Endpoint**
   ```bash
   curl http://localhost:3000/api/dev/orders-dump
   ```
   Should return the latest orders including your new 'paid' order.

6. **Verify Firestore**
   - Check your Firestore console
   - Look for new document in 'orders' collection
   - Verify order has status: 'paid' and stripe metadata

7. **Check Admin Dashboard**
   - Navigate to `/admin/orders`
   - Verify new 'paid' order appears in "All" tab
   - Confirm order shows in "Paid" filter
   - Check real-time updates work

### Expected Log Outputs

**Successful Webhook Processing:**
```
Received Stripe event checkout.session.completed evt_1234567890
Order upserted order_cs_test_1234567890
```

**Error Cases:**
```
Webhook error [Error details]
```

### Debug Endpoint Usage

The debug endpoint `/api/dev/orders-dump` returns the last 10 orders:

```bash
# Get latest orders
curl http://localhost:3000/api/dev/orders-dump

# Response format:
{
  "success": true,
  "count": 10,
  "orders": [
    {
      "id": "order_cs_test_xxxxx",
      "status": "paid",
      "stripe": {
        "sessionId": "cs_test_xxxxx",
        "eventId": "evt_xxxxx"
      },
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

## Notes
- The CLI sends well-formed events; our webhook should be idempotent. Re-triggering will not create duplicates.
- If you see 400 from webhook, check the signature secret and logs in Firestore `errorLogs`.
- Console logs provide immediate feedback for debugging webhook processing.
- Debug endpoint is temporary and should be removed in production.

## Acceptance
- Running `npm run stripe:listen` then `npm run stripe:trigger` results in a new order visible at `/api/dev/orders-dump`.
- `/api/stripe/health` returns `ok:true`.
- No duplicate orders when triggering multiple times.
- Console shows "Received Stripe event" and "Order upserted" messages.
- Admin dashboard immediately shows new 'paid' orders.
- Complete flow from Stripe checkout to Admin dashboard works end-to-end.