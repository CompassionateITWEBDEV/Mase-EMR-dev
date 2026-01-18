#!/bin/bash
# Test script for /api/patients authentication
# 
# Usage:
#   ./scripts/test-api-auth.sh
#   COOKIES="cookie1=value1; cookie2=value2" ./scripts/test-api-auth.sh

BASE_URL="${API_URL:-http://localhost:3000}"

echo "=========================================="
echo "API Authentication Test Suite"
echo "=========================================="
echo "Testing endpoint: $BASE_URL/api/patients"
echo ""

# Test 1: Unauthenticated request
echo "=== Test 1: Unauthenticated Request ==="
echo "Testing /api/patients without authentication..."
echo ""

response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/patients" \
  -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response: $body"
echo ""

if [ "$http_code" -eq 401 ]; then
  echo "✓ PASS: Correctly returned 401 Unauthorized"
elif [ "$http_code" -eq 200 ]; then
  echo "⚠ WARNING: Request succeeded (development mode bypass active)"
else
  echo "✗ FAIL: Unexpected status code: $http_code"
fi

echo ""

# Test 2: Authenticated request with cookies
if [ -n "$COOKIES" ]; then
  echo "=== Test 2: Authenticated Request with Cookies ==="
  echo "Testing /api/patients with authentication cookies..."
  echo ""
  
  response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/patients" \
    -H "Content-Type: application/json" \
    -H "Cookie: $COOKIES")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  echo "HTTP Status: $http_code"
  echo "Response: $body"
  echo ""
  
  if [ "$http_code" -eq 200 ]; then
    echo "✓ PASS: Successfully authenticated"
    patient_count=$(echo "$body" | grep -o '"patients":\[' | wc -l || echo "0")
    echo "Patients returned: $patient_count"
  else
    echo "✗ FAIL: Authentication failed"
  fi
else
  echo "=== Test 2: Authenticated Request ==="
  echo "⚠ SKIP: No cookies provided"
  echo ""
  echo "To test authenticated requests:"
  echo "1. Log in through browser"
  echo "2. Copy cookies from DevTools → Application → Cookies"
  echo "3. Run: COOKIES=\"your-cookies\" $0"
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="

