#!/usr/bin/env bash
# ============================================================
# smoke.sh — end-to-end smoke test for ShopKart
# Usage:  BASE_URL=http://localhost:5000 ./tests/smoke/smoke.sh
# ============================================================
set -e

BASE_URL="${BASE_URL:-http://localhost:5000}"
FAILED=0

pass() { echo "  PASS  $1"; }
fail() { echo "  FAIL  $1"; FAILED=$((FAILED + 1)); }

check_status() {
  local path="$1"
  local expected="$2"
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" || echo "000")
  if [ "$actual" = "$expected" ]; then
    pass "GET $path -> $actual"
  else
    fail "GET $path -> $actual (expected $expected)"
  fi
}

echo "=== ShopKart smoke test ==="
echo "Target: $BASE_URL"
echo ""

echo "[Health]"
check_status "/api/health" 200

echo ""
echo "[Products]"
check_status "/api/products" 200
check_status "/api/products/1" 200
check_status "/api/products/999999" 404

echo ""
echo "[Categories]"
check_status "/api/categories" 200

echo ""
echo "[Auth]"
REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Test\",\"email\":\"smoke-$(date +%s)@example.com\",\"password\":\"secret123\"}" || echo "{}")
TOKEN=$(echo "$REGISTER" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || true)
if [ -n "$TOKEN" ]; then
  pass "Register returns token"
else
  fail "Register failed to return token"
fi

echo ""
echo "[Authenticated]"
if [ -n "$TOKEN" ]; then
  AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/users/profile")
  if [ "$AUTH_STATUS" = "200" ]; then
    pass "GET /api/users/profile with token -> 200"
  else
    fail "GET /api/users/profile with token -> $AUTH_STATUS"
  fi

  CART_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/cart")
  if [ "$CART_STATUS" = "200" ]; then
    pass "GET /api/cart with token -> 200"
  else
    fail "GET /api/cart with token -> $CART_STATUS"
  fi
fi

echo ""
echo "[Unauthorized]"
check_status "/api/cart" 401

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✅ All smoke tests passed."
  exit 0
else
  echo "❌ $FAILED smoke test(s) failed."
  exit 1
fi
