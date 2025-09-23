#!/usr/bin/env bash
set -euo pipefail
# Requires: Stripe CLI installed and logged in (`stripe login`)
# Forwards all events to our local Next.js dev server webhook route.
PORT="${PORT:-3000}"
echo "Forwarding Stripe events to http://localhost:${PORT}/api/stripe/webhook ..."
stripe listen --forward-to localhost:${PORT}/api/stripe/webhook