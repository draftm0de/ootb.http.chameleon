#!/bin/bash

set -e

if [ -z "$BASE_URL" ]; then
  if [ -f "../.env" ]; then
    HOST=$(grep "^HOST=" ../.env | cut -d '=' -f2)
    PORT=$(grep "^PORT=" ../.env | cut -d '=' -f2)
    BASE_URL="${HOST}:${PORT}"
  else
    BASE_URL="http://localhost:3000"
  fi
fi
FAILED=0
PASSED=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Running HTTP Mock Server Tests${NC}"
echo "Base URL: $BASE_URL"
echo ""

test_case() {
  local name="$1"
  local expected_status="$2"
  local actual_status="$3"
  local expected_body="$4"
  local actual_body="$5"

  if [ "$expected_status" == "$actual_status" ]; then
    if [ -z "$expected_body" ] || echo "$actual_body" | grep -qF "$expected_body"; then
      echo -e "${GREEN}✓${NC} $name"
      PASSED=$((PASSED + 1))
    else
      echo -e "${RED}✗${NC} $name (body mismatch)"
      echo "  Expected: $expected_body"
      echo "  Actual: $actual_body"
      FAILED=$((FAILED + 1))
    fi
  else
    echo -e "${RED}✗${NC} $name (status code mismatch)"
    echo "  Expected: $expected_status"
    echo "  Actual: $actual_status"
    FAILED=$((FAILED + 1))
  fi
}

echo "=== POST/PUT/PATCH Tests ==="

echo "Test 1: POST creates entity file"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/entity" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"name":"Test Entity"}')
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "POST /entity" "200" "$STATUS" "success" "$BODY"

echo "Test 2: PUT creates nested file"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/users/21" \
  -H "Content-Type: application/json" \
  -d '{"id":21,"name":"User 21"}')
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "PUT /users/21" "200" "$STATUS" "success" "$BODY"

echo "Test 3: POST creates users array"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '[{"id":1,"name":"User 1"},{"id":21,"name":"User 21"},{"id":42,"name":"User 42"}]')
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "POST /users (array)" "200" "$STATUS" "success" "$BODY"

echo ""
echo "=== GET Tests ==="

echo "Test 4: GET returns existing entity"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/entity")
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "GET /entity" "200" "$STATUS" "Test Entity" "$BODY"

echo "Test 5: GET finds user by ID in array"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/users/21")
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "GET /users/21 (from array)" "200" "$STATUS" "User 21" "$BODY"

echo "Test 6: GET returns 404 for missing ID"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/users/999")
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "GET /users/999 (not found)" "404" "$STATUS" "" "$BODY"

echo "Test 7: GET returns empty array for missing plural"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/products")
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "GET /products (missing plural)" "200" "$STATUS" "[]" "$BODY"

echo "Test 8: GET returns 404 for missing singular"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/product")
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "GET /product (missing singular)" "404" "$STATUS" "" "$BODY"

echo "Test 9: PATCH updates entity"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/entity" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"name":"Updated Entity"}')
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "PATCH /entity" "200" "$STATUS" "success" "$BODY"

echo "Test 10: GET returns updated entity"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/entity")
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "GET /entity (updated)" "200" "$STATUS" "Updated Entity" "$BODY"

echo ""
echo "=== Proxy Tests ==="

echo "Test 11: Proxy HTTP request"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/http/example.com")
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "GET /http/example.com" "200" "$STATUS" "Example Domain" "$BODY"

echo "Test 12: Proxy HTTPS request"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/https/example.com")
STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
test_case "GET /https/example.com" "200" "$STATUS" "Example Domain" "$BODY"

echo ""
echo "=== Summary ==="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -gt 0 ]; then
  exit 1
fi

exit 0
