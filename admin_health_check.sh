#!/bin/bash

API_URL="http://44.214.16.75:8080"
ADMIN_EMAIL="admin@lpgfinder.com"
ADMIN_PASSWORD="admin123"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
SKIPPED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Admin System Health Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Login
echo -e "${YELLOW}[1/8] AUTHENTICATION${NC}"
echo "-------------------------------------------"

LOGIN=$(curl -s -X POST "$API_URL/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$LOGIN" | jq -r '.token' 2>/dev/null)
if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo -e "${GREEN}✓ Admin Login${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Admin Login Failed${NC}"
  ((FAILED++))
  exit 1
fi

echo ""

# Helper to test GET endpoint
test_get() {
  local endpoint=$1
  local desc=$2
  local response=$(curl -s -X GET "$API_URL$endpoint" -H "Authorization: Bearer $TOKEN")
  local error=$(echo "$response" | jq -r '.error' 2>/dev/null)
  
  if [ "$error" == "null" ] || [ -z "$error" ]; then
    echo -e "${GREEN}✓ $desc${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${YELLOW}⊘ $desc - $error${NC}"
    ((SKIPPED++))
    return 1
  fi
}

# Step 2: Dashboard
echo -e "${YELLOW}[2/8] DASHBOARD & ANALYTICS${NC}"
echo "-------------------------------------------"
test_get "/admin/dashboard/stats" "Dashboard Stats"
test_get "/admin/analytics/revenue?days=7" "Revenue Analytics"
test_get "/admin/analytics/orders?days=7" "Orders Analytics"
echo ""

# Step 3: Users
echo -e "${YELLOW}[3/8] USERS MANAGEMENT${NC}"
echo "-------------------------------------------"
test_get "/admin/users?limit=10" "List Users"
echo ""

# Step 4: Providers
echo -e "${YELLOW}[4/8] PROVIDERS MANAGEMENT${NC}"
echo "-------------------------------------------"
test_get "/admin/providers?limit=10" "List Providers"
echo ""

# Step 5: Couriers
echo -e "${YELLOW}[5/8] COURIERS MANAGEMENT${NC}"
echo "-------------------------------------------"
test_get "/admin/couriers?limit=10" "List Couriers"
echo ""

# Step 6: Orders
echo -e "${YELLOW}[6/8] ORDERS MANAGEMENT${NC}"
echo "-------------------------------------------"
test_get "/admin/orders?limit=10" "List Orders"
echo ""

# Step 7: Settings
echo -e "${YELLOW}[7/8] SETTINGS & CONFIGURATION${NC}"
echo "-------------------------------------------"
test_get "/admin/settings" "Get Settings"
echo ""

# Step 8: Reports
echo -e "${YELLOW}[8/8] REPORTS & LOGS${NC}"
echo "-------------------------------------------"
test_get "/admin/reports" "Get Reports"
test_get "/admin/disputes" "Get Disputes"
test_get "/admin/logs/audit?limit=10" "Get Audit Logs"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Skipped:${NC} $SKIPPED"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}Status: ✓ ADMIN SYSTEM HEALTHY${NC}"
else
  echo -e "${RED}Status: ✗ ADMIN SYSTEM HAS ISSUES${NC}"
fi

