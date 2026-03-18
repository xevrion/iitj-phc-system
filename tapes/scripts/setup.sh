#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
#  Common setup — source this at the top of every test script.
#  Sets: BASE, colour vars, tokens, stable IDs (MEDICINE_ID, PATIENT_ID,
#  DOCTOR_ID), and helper functions run_tc / perf_tc / repeat_tc / jv.
# ─────────────────────────────────────────────────────────────────────

BASE="http://localhost:8000/api/v1"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m';  BOLD='\033[1m';   NC='\033[0m'

# ── Token acquisition ──────────────────────────────────────────────
_login() {
  curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"ldapId\":\"$1\",\"password\":\"anything\"}" \
    | jq -r '.data.token'
}

printf "  Acquiring tokens ..."
RECEPTION_TOKEN=$(_login reception01)
DOCTOR_TOKEN=$(_login doctor01)
PATIENT_TOKEN=$(_login patient01)
PHARMACY_TOKEN=$(_login pharmacy01)
LAB_TOKEN=$(_login lab01)
ADMIN_TOKEN=$(_login admin01)
echo -e " ${GREEN}done${NC}"

# ── Doctor state reset ─────────────────────────────────────────────
curl -s -X POST "$BASE/doctors/me/checkout" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null 2>&1
curl -s -X PUT "$BASE/doctors/me/availability" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isAvailable":true}' > /dev/null 2>&1

# ── Stable IDs ────────────────────────────────────────────────────
printf "  Fetching IDs ..."
MEDICINE_ID=$(curl -s "$BASE/medicines" \
  -H "Authorization: Bearer $PHARMACY_TOKEN" \
  | jq -r '.data[] | select(.name | contains("Paracetamol")) | .id')
PATIENT_ID=$(curl -s "$BASE/patients/qr/QR001" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  | jq -r '.data.id')
DOCTOR_ID=$(curl -s "$BASE/doctors" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  | jq -r '.data[0].id')

# Reset Paracetamol stock to 50
curl -s -X PUT "$BASE/medicines/$MEDICINE_ID/stock" \
  -H "Authorization: Bearer $PHARMACY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stockQuantity":50}' > /dev/null 2>&1
echo -e " ${GREEN}done${NC}"

# ── Helpers ───────────────────────────────────────────────────────
LAST_BODY=""

# run_tc TC_ID TITLE EXPECTED_HTTP METHOD ENDPOINT [extra curl args...]
run_tc() {
  local tc="$1" title="$2" expected="$3" method="$4" endpoint="$5"; shift 5
  echo
  echo -e "${YELLOW}━━━ [$tc] $title ━━━${NC}"
  echo -e "${CYAN}$method $BASE$endpoint${NC}"
  local status
  status=$(curl -s -X "$method" "$BASE$endpoint" "$@" \
    --output /tmp/phc_resp --write-out '%{http_code}')
  LAST_BODY=$(cat /tmp/phc_resp)
  if [ "$status" -eq "$expected" ]; then
    echo -e "${GREEN}→ HTTP $status ✓${NC}"
  else
    echo -e "${RED}→ HTTP $status (expected $expected) ✗${NC}"
  fi
  echo "$LAST_BODY" | jq . 2>/dev/null || echo "$LAST_BODY"
}

# perf_tc TC_ID TITLE EXPECTED_HTTP THRESHOLD_MS [extra curl args...]
perf_tc() {
  local tc="$1" title="$2" expected="$3" threshold="$4"; shift 4
  echo
  echo -e "${YELLOW}━━━ [$tc] $title ━━━${NC}"
  local t0 elapsed status
  t0=$(date +%s%3N)
  status=$(curl -s "$@" --output /tmp/phc_resp --write-out '%{http_code}')
  elapsed=$(( $(date +%s%3N) - t0 ))
  LAST_BODY=$(cat /tmp/phc_resp)
  if [ "$status" -eq "$expected" ] && [ "$elapsed" -le "$threshold" ]; then
    echo -e "${GREEN}✓ HTTP $status  ${elapsed}ms  (threshold: ${threshold}ms)${NC}"
  else
    echo -e "${RED}✗ HTTP $status  ${elapsed}ms  (threshold: ${threshold}ms)${NC}"
  fi
  echo "$LAST_BODY" | jq . 2>/dev/null || echo "$LAST_BODY"
}

# repeat_tc TC_ID TITLE N THRESHOLD_MS [extra curl args...]
repeat_tc() {
  local tc="$1" title="$2" n="$3" threshold="$4"; shift 4
  echo
  echo -e "${YELLOW}━━━ [$tc] $title (${n} runs) ━━━${NC}"
  local pass=0 fail=0 times=""
  for i in $(seq 1 "$n"); do
    local t0 elapsed status
    t0=$(date +%s%3N)
    status=$(curl -s "$@" --output /tmp/phc_resp --write-out '%{http_code}')
    elapsed=$(( $(date +%s%3N) - t0 ))
    times="$times $elapsed"
    if [ "$status" -lt 400 ] && [ "$elapsed" -le "$threshold" ]; then
      pass=$((pass+1)); printf "${GREEN}.${NC}"
    else
      fail=$((fail+1)); printf "${RED}x${NC}"
    fi
  done
  echo
  local avg min max
  avg=$(echo "$times" | tr ' ' '\n' | grep -v '^$' | awk '{s+=$1;c++} END{printf "%d",s/c}')
  min=$(echo "$times" | tr ' ' '\n' | grep -v '^$' | sort -n | head -1)
  max=$(echo "$times" | tr ' ' '\n' | grep -v '^$' | sort -n | tail -1)
  if [ "$fail" -eq 0 ]; then
    echo -e "${GREEN}✓ All ${n} runs passed  min=${min}ms  avg=${avg}ms  max=${max}ms${NC}"
  else
    echo -e "${RED}✗ ${fail}/${n} failed  min=${min}ms  avg=${avg}ms  max=${max}ms${NC}"
  fi
}

jv() { echo "$LAST_BODY" | jq -r "$1" 2>/dev/null; }
