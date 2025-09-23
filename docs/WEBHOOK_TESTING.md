# Webhook Testing (Local)

## Prereqs
- `stripe` CLI installed and logged in: `https://docs.stripe.com/stripe-cli`
- `STRIPE_SECRET_KEY` (test) set in `.env.local`
- `STRIPE_WEBHOOK_SECRET` is not required for local when using `stripe listen` (it injects a signing secret into STRIPE_WEBHOOK_SECRET automatically in the process env); if our webhook verifies signatures, export the secret value printed by `stripe listen`.

## Steps
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

## Notes
- The CLI sends well-formed events; our webhook should be idempotent. Re-triggering will not create duplicates.
- If you see 400 from webhook, check the signature secret and logs in Firestore `errorLogs`.

## Acceptance
- Running `npm run stripe:listen` then `npm run stripe:trigger` results in a new order visible at `/api/dev/orders-dump`.
- `/api/stripe/health` returns `ok:true`.
- No duplicate orders when triggering multiple times.