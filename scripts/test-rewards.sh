#!/bin/bash
set -e

echo "Testing Spin..."
curl -sS -X POST http://localhost:3000/api/rewards/spin \
 -H "Idempotency-Key: spin-$(uuidgen)" \
 | jq .

echo "Testing Redeem..."
curl -sS -X POST http://localhost:3000/api/rewards/redeem \
 -H "Idempotency-Key: redeem-$(uuidgen)" \
 -H "Content-Type: application/json" \
 -d '{"reward_id":"side_100","order_id":"test"}' \
 | jq .