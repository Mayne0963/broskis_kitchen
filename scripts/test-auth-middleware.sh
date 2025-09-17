#!/bin/bash

# Authentication Middleware Test Script
# Tests the middleware changes for admin route protection

BASE_URL="http://localhost:3000"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Testing Authentication Middleware"
echo "📍 Base URL: $BASE_URL"
echo "="$(printf '=%.0s' {1..50})

# Function to test a route
test_route() {
    local name="$1"
    local path="$2"
    local cookie="$3"
    local expected_status="$4"
    local description="$5"
    
    echo -e "\n🧪 Test: $name"
    echo "   Path: $path"
    echo "   Description: $description"
    
    if [ -n "$cookie" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code};REDIRECT:%{redirect_url}" \
                       -H "Cookie: $cookie" \
                       -H "User-Agent: Auth-Test-Script/1.0" \
                       "$BASE_URL$path")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code};REDIRECT:%{redirect_url}" \
                       -H "User-Agent: Auth-Test-Script/1.0" \
                       "$BASE_URL$path")
    fi
    
    # Extract status code and redirect URL
    status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    redirect=$(echo "$response" | grep -o "REDIRECT:.*" | cut -d: -f2-)
    
    echo "   Status: $status (expected: $expected_status)"
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "   Result: ${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "   Result: ${RED}❌ FAIL${NC}"
        if [ -n "$redirect" ] && [ "$redirect" != "" ]; then
            echo "   Redirect: $redirect"
        fi
        return 1
    fi
}

# Function to generate a test JWT token
generate_test_token() {
    local role="$1"
    local valid="$2"
    
    if [ "$valid" = "false" ]; then
        echo "invalid.token.here"
        return
    fi
    
    # Create a simple test JWT (header.payload.signature)
    local header=$(echo '{"alg":"HS256","typ":"JWT"}' | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
    local current_time=$(date +%s)
    local exp_time=$((current_time + 3600))
    local payload_json="{\"uid\":\"test-$role-user\",\"email\":\"test-$role@example.com\",\"email_verified\":true,\"role\":\"$role\",\"exp\":$exp_time,\"iat\":$current_time}"
    local payload=$(echo "$payload_json" | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
    local signature="test-signature"
    
    echo "$header.$payload.$signature"
}

# Check if server is running
echo "🔍 Checking if development server is running..."
if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Development server is not running on localhost:3000${NC}"
    echo "   Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"

# Test cases
echo -e "\n📋 Running test cases..."

passed=0
total=0

# Test 1: Admin route with no cookie
test_route "Admin with no cookie" "/admin" "" "302" "Should redirect to login"
if [ $? -eq 0 ]; then ((passed++)); fi
((total++))

# Test 2: Admin route with invalid cookie
invalid_token=$(generate_test_token "customer" "false")
test_route "Admin with invalid cookie" "/admin" "session=$invalid_token" "302" "Should redirect to login"
if [ $? -eq 0 ]; then ((passed++)); fi
((total++))

# Test 3: Admin route with customer cookie
customer_token=$(generate_test_token "customer" "true")
test_route "Admin with customer cookie" "/admin" "session=$customer_token" "302" "Should redirect to login (admin required)"
if [ $? -eq 0 ]; then ((passed++)); fi
((total++))

# Test 4: Admin route with admin cookie
admin_token=$(generate_test_token "admin" "true")
test_route "Admin with admin cookie" "/admin" "session=$admin_token" "200" "Should allow access"
if [ $? -eq 0 ]; then ((passed++)); fi
((total++))

# Test 5: Admin health endpoint (should be public)
test_route "Admin health endpoint" "/admin/health" "" "200" "Should be publicly accessible"
if [ $? -eq 0 ]; then ((passed++)); fi
((total++))

# Test 6: Profile route with no cookie (should be handled by SessionGate)
test_route "Profile with no cookie" "/profile" "" "200" "Should show loading skeleton via SessionGate"
if [ $? -eq 0 ]; then ((passed++)); fi
((total++))

# Summary
echo -e "\n"$(printf '=%.0s' {1..50})
echo "📊 Test Summary:"
echo "   Passed: $passed/$total"

if [ $passed -eq $total ]; then
    echo -e "\n${GREEN}🎉 All middleware tests passed!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Please review the middleware implementation.${NC}"
    exit 1
fi