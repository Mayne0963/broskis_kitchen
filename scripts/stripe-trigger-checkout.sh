#!/usr/bin/env bash
set -euo pipefail
# Triggers a test Checkout session completed event set via Stripe CLI.
# Make sure scripts/stripe-listen.sh is running in another tab first.
echo "Triggering checkout.session.completed ..."
stripe trigger checkout.session.completed