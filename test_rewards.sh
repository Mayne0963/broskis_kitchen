#!/bin/bash

# Broski's Rewards API Test Script
# This script tests all /api/rewards endpoints with comprehensive scenarios

# Configuration
BASE_URL="${BASE:-http://localhost:3000}"
ID_TOKEN="${ID_TOKEN:-your-firebase-id-token-here}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Helper function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required but not installed. Please install jq first.${NC}"
    exit 1
fi

# Check if required variables are set
if [ "$ID_TOKEN" = "your-firebase-id-token-here" ]; then
    echo -e "${YELLOW}Warning: Please set ID_TOKEN environment variable with a valid Firebase ID token${NC}"
    echo "Usage: ID_TOKEN=your-token BASE=http://localhost:3000 ./test_rewards.sh"
    echo "Continuing with placeholder token for demonstration..."
fi

echo -e "${GREEN}Starting Broski's Rewards API Tests${NC}"
echo "Base URL: $BASE_URL"
echo "ID Token: ${ID_TOKEN:0:20}..."

# Test 1: Get Rewards Catalog
print_section "1. Testing Rewards Catalog (GET /api/rewards/catalog)"
curl -s -X GET "$BASE_URL/api/rewards/catalog" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" | jq .
print_result $? "Catalog endpoint test"

# Test 2: Get User Balance
print_section "2. Testing User Balance (GET /api/rewards/balance)"
curl -s -X GET "$BASE_URL/api/rewards/balance" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" | jq .
print_result $? "Balance endpoint test"

# Test 3: First Spin (Should succeed)
print_section "3. Testing First Spin (POST /api/rewards/spin)"
IDEMPOTENCY_KEY_1="test-spin-$(date +%s)"
curl -s -X POST "$BASE_URL/api/rewards/spin" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY_1\"
  }" | jq .
print_result $? "First spin test"

# Test 4: Second Spin (Should fail with rate limit)
print_section "4. Testing Second Spin - Rate Limit (POST /api/rewards/spin)"
IDEMPOTENCY_KEY_2="test-spin-$(date +%s)-2"
curl -s -X POST "$BASE_URL/api/rewards/spin" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY_2\"
  }" | jq .
print_result $? "Rate limit test (should show error)"

# Test 5: Redeem with Insufficient Points
print_section "5. Testing Redeem - Insufficient Points (POST /api/rewards/redeem)"
IDEMPOTENCY_KEY_3="test-redeem-$(date +%s)"
curl -s -X POST "$BASE_URL/api/rewards/redeem" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"rewardId\": \"free_entree_500\",
    \"orderId\": \"test-order-$(date +%s)\",
    \"orderSubtotal\": 25.99,
    \"rewardType\": \"free_item\",
    \"rewardValue\": \"entree\",
    \"pointsCost\": 500,
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY_3\"
  }" | jq .
print_result $? "Insufficient points test (should show error)"

# Test 6: Redeem Free Side (100 points)
print_section "6. Testing Redeem - Free Side (POST /api/rewards/redeem)"
IDEMPOTENCY_KEY_4="test-redeem-side-$(date +%s)"
ORDER_ID="test-order-$(date +%s)"
curl -s -X POST "$BASE_URL/api/rewards/redeem" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"rewardId\": \"free_side_100\",
    \"orderId\": \"$ORDER_ID\",
    \"orderSubtotal\": 15.99,
    \"rewardType\": \"free_item\",
    \"rewardValue\": \"side_dish\",
    \"pointsCost\": 100,
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY_4\"
  }" | jq .
print_result $? "Free side redemption test"

# Test 7: Idempotency Test (Same redemption)
print_section "7. Testing Idempotency - Same Redemption (POST /api/rewards/redeem)"
curl -s -X POST "$BASE_URL/api/rewards/redeem" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"rewardId\": \"free_side_100\",
    \"orderId\": \"$ORDER_ID\",
    \"orderSubtotal\": 15.99,
    \"rewardType\": \"free_item\",
    \"rewardValue\": \"side_dish\",
    \"pointsCost\": 100,
    \"idempotencyKey\": \"$IDEMPOTENCY_KEY_4\"
  }" | jq .
print_result $? "Idempotency test (should return cached result)"

# Test 8: Get Redemption History
print_section "8. Testing Redemption History (GET /api/rewards/redeem)"
curl -s -X GET "$BASE_URL/api/rewards/redeem" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" | jq .
print_result $? "Redemption history test"

# Test 9: Check Balance After Redemption
print_section "9. Testing Balance After Redemption (GET /api/rewards/balance)"
curl -s -X GET "$BASE_URL/api/rewards/balance" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" | jq .
print_result $? "Final balance check"

# Test 10: Authentication Test (No token)
print_section "10. Testing Authentication - No Token"
curl -s -X GET "$BASE_URL/api/rewards/balance" \
  -H "Content-Type: application/json" | jq .
print_result $? "No auth test (should show 401 error)"

print_section "Test Summary"
echo -e "${GREEN}All tests completed!${NC}"
echo -e "${YELLOW}Note: Some tests are expected to fail (rate limits, insufficient points, etc.)${NC}"
echo -e "${BLUE}Check the JSON responses above for detailed results${