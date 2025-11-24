#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3002}

echo "Creating test Lunch Drop via website API..."
create_resp=$(curl -s -X POST "$BASE_URL/api/test/create-menu-drop")
echo "$create_resp" | jq . || echo "$create_resp"

drop_id=$(echo "$create_resp" | jq -r .id 2>/dev/null || true)
if [ -z "${drop_id:-}" ] || [ "$drop_id" = "null" ]; then
  echo "Failed to extract drop ID" >&2
  exit 1
fi

echo "Verifying in Firebase (Admin) via website API..."
list_resp=$(curl -s "$BASE_URL/api/test/list-menu-drops")
echo "$list_resp" | jq '.[] | select(.id=="'$drop_id'")' || echo "$list_resp"

echo "Done. Created drop ID: $drop_id"
