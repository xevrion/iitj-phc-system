#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
#  PHC Integrated Digital System — Automated Test Suite
#  45 test cases: Functional, Negative, Boundary, Performance (NFR)
#
#  Usage:  bash smoke_test.sh [BASE_URL]
#  Default BASE_URL: http://localhost:8000/api/v1
#
#  Prerequisites:
#    - Server running (npm run dev from backend/)
#    - DB seeded     (npm run seed from backend/)
#    - python3       (for JSON parsing)
#    - curl
# ════════════════════════════════════════════════════════════════════

BASE="${1:-http://localhost:8000/api/v1}"
PASS=0
FAIL=0

# ── Colours ──────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────

# check TC_ID NAME EXPECTED_HTTP ACTUAL_HTTP RESPONSE_MS [TIME_OK]
check() {
  local id="$1" name="$2" expected="$3" actual="$4" ms="$5" time_ok="${6:-true}"
  if [ "$actual" -eq "$expected" ] && [ "$time_ok" = "true" ]; then
    printf "  ${GREEN}✓ PASS${NC}  %-10s %s  ${CYAN}(HTTP %s, %sms)${NC}\n" "[$id]" "$name" "$actual" "$ms"
    PASS=$((PASS+1))
  else
    if [ "$actual" -ne "$expected" ]; then
      printf "  ${RED}✗ FAIL${NC}  %-10s %s  ${CYAN}(Expected %s, got HTTP %s, %sms)${NC}\n" "[$id]" "$name" "$expected" "$actual" "$ms"
    else
      printf "  ${RED}✗ FAIL${NC}  %-10s %s  ${CYAN}(HTTP %s ok but %sms exceeded threshold)${NC}\n" "[$id]" "$name" "$actual" "$ms"
    fi
    FAIL=$((FAIL+1))
  fi
}

# Sets: HTTP_STATUS  RESPONSE_TIME (ms)  RESPONSE_BODY
req() {
  local method="$1" url="$2" token="$3" body="$4"
  local args=(-s -X "$method" --write-out $'\n%{http_code}\n%{time_total}' --output /tmp/_phc_resp)
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$body"  ] && args+=(-H "Content-Type: application/json" -d "$body")
  local raw
  raw=$(curl "${args[@]}" "$url" 2>/dev/null)
  HTTP_STATUS=$(echo "$raw" | tail -2 | head -1 | tr -d '[:space:]')
  HTTP_STATUS="${HTTP_STATUS:-000}"
  RESPONSE_TIME=$(echo "$raw" | tail -1 | awk '{printf "%d", $1*1000}')
  RESPONSE_BODY=$(cat /tmp/_phc_resp 2>/dev/null)
}

# Extract a value from the last response body using Python
jv() { echo "$RESPONSE_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print($1)" 2>/dev/null; }

section() {
  echo
  echo -e "${YELLOW}──────────────────────────────────────────────────${NC}"
  echo -e "  ${YELLOW}$1${NC}"
  echo -e "${YELLOW}──────────────────────────────────────────────────${NC}"
}

login() {
  req POST "$BASE/auth/login" "" "{\"ldapId\":\"$1\",\"password\":\"anything\"}"
  jv "d['data']['token']"
}

# ════════════════════════════════════════════════════════════════════
echo
echo -e "${YELLOW}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   PHC Integrated Digital System — Test Suite     ║${NC}"
echo -e "${YELLOW}║   45 Test Cases  ·  Sprints 1–4                  ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════╝${NC}"
echo -e "  Base URL: ${CYAN}$BASE${NC}"

# ── Pre-flight ────────────────────────────────────────────────────────
req GET "${BASE%/api/v1}/" "" ""
if [ "$HTTP_STATUS" != "200" ]; then
  echo -e "\n  ${RED}✗ Server not reachable. Start it with: npm run dev${NC}\n"; exit 1
fi
echo -e "  ${GREEN}✓ Server is up${NC}"

# ── Acquire tokens ────────────────────────────────────────────────────
section "Acquiring tokens for all 6 roles"
RECEPTION_TOKEN=$(login reception01)
DOCTOR_TOKEN=$(login doctor01)
PATIENT_TOKEN=$(login patient01)
PHARMACY_TOKEN=$(login pharmacy01)
LAB_TOKEN=$(login lab01)
ADMIN_TOKEN=$(login admin01)

if [ -z "$RECEPTION_TOKEN" ] || [ -z "$DOCTOR_TOKEN" ] || [ -z "$PATIENT_TOKEN" ]; then
  echo -e "  ${RED}✗ Could not acquire tokens. Run: npm run seed${NC}\n"; exit 1
fi
echo -e "  ${GREEN}✓ All 6 role tokens acquired${NC}"

# ── Reset doctor state before grabbing IDs ────────────────────────────
# Checkout first (idempotent), then restore availability so GET /doctors returns results
req POST "$BASE/doctors/me/checkout" "$DOCTOR_TOKEN" "" > /dev/null 2>&1
req PUT "$BASE/doctors/me/availability" "$DOCTOR_TOKEN" '{"isAvailable":true}' > /dev/null 2>&1

# ── Grab stable IDs ───────────────────────────────────────────────────
req GET "$BASE/doctors" "$RECEPTION_TOKEN" ""
DOCTOR_ID=$(jv "d['data'][0]['id']")

req GET "$BASE/patients/qr/QR001" "$RECEPTION_TOKEN" ""
PATIENT_ID=$(jv "d['data']['id']")

req GET "$BASE/medicines" "$DOCTOR_TOKEN" ""
MEDICINE_ID=$(jv "next(m['id'] for m in d['data'] if 'Paracetamol' in m['name'])")

# ════════════════════════════════════════════════════════════════════
section "Functional Tests — Positive (TC-F-001 to TC-F-025)"

req POST "$BASE/auth/login" "" '{"ldapId":"doctor01","password":"anything"}'
check "TC-F-001" "Login with valid credentials returns JWT" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req GET "$BASE/auth/me" "$DOCTOR_TOKEN" ""
check "TC-F-002" "Get current user info" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req GET "$BASE/patients/me" "$PATIENT_TOKEN" ""
check "TC-F-003" "Patient views own profile" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req PUT "$BASE/patients/me" "$PATIENT_TOKEN" '{"phone":"9999999999"}'
check "TC-F-004" "Patient updates own profile" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req GET "$BASE/patients/qr/QR001" "$RECEPTION_TOKEN" ""
check "TC-F-005" "Reception identifies patient by QR code" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req POST "$BASE/checkin" "$RECEPTION_TOKEN" \
  '{"qrCode":"QR001","visitType":"OPD","vitals":{"weight":65.5,"temperature":98.6,"bloodPressure":"120/80"}}'
check "TC-F-006" "QR check-in creates visit + vitals atomically" 201 "$HTTP_STATUS" "$RESPONSE_TIME"
VISIT_ID=$(jv "d['data']['id']")

req POST "$BASE/doctors/me/checkin" "$DOCTOR_TOKEN" ""
check "TC-F-007" "Doctor checks in (opens attendance record)" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req GET "$BASE/visits/my-queue" "$DOCTOR_TOKEN" ""
check "TC-F-008" "Doctor views waiting patient queue" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req PUT "$BASE/visits/$VISIT_ID/claim" "$DOCTOR_TOKEN" ""
check "TC-F-009" "Doctor claims visit (status → IN_CONSULTATION)" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req PUT "$BASE/visits/$VISIT_ID/consultation" "$DOCTOR_TOKEN" \
  '{"consultationNotes":"Patient has mild fever. Prescribed paracetamol."}'
check "TC-F-010" "Doctor saves consultation notes" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req POST "$BASE/visits/$VISIT_ID/prescription" "$DOCTOR_TOKEN" \
  "{\"notes\":\"Take after meals\",\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"dosage\":\"500mg\",\"duration\":\"3 days\"}]}"
check "TC-F-011" "Doctor creates digital prescription" 201 "$HTTP_STATUS" "$RESPONSE_TIME"
PRESCRIPTION_ID=$(jv "d['data']['id']")

req POST "$BASE/visits/$VISIT_ID/lab-requests" "$DOCTOR_TOKEN" '{"testName":"CBC - Complete Blood Count"}'
check "TC-F-012" "Doctor requests lab test" 201 "$HTTP_STATUS" "$RESPONSE_TIME"
LAB_REQUEST_ID=$(jv "d['data']['id']")

req PUT "$BASE/visits/$VISIT_ID/complete" "$DOCTOR_TOKEN" ""
check "TC-F-013" "Doctor completes visit (status → COMPLETED)" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req POST "$BASE/doctors/me/checkout" "$DOCTOR_TOKEN" ""
check "TC-F-014" "Doctor checks out (closes attendance, computes hours)" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req GET "$BASE/prescriptions/pending" "$PHARMACY_TOKEN" ""
check "TC-F-015" "Pharmacy views undispensed prescription queue" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req PUT "$BASE/prescriptions/$PRESCRIPTION_ID/dispense" "$PHARMACY_TOKEN" ""
check "TC-F-016" "Pharmacy dispenses prescription" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req POST "$BASE/visits/$VISIT_ID/bill" "$PHARMACY_TOKEN" \
  "{\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"quantity\":2}]}"
check "TC-F-017" "Pharmacy generates bill with atomic stock deduction" 201 "$HTTP_STATUS" "$RESPONSE_TIME"
BILL_ID=$(jv "d['data']['id']")

req PUT "$BASE/bills/$BILL_ID/pay" "$PHARMACY_TOKEN" ""
check "TC-F-018" "Pharmacy marks bill as paid" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req POST "$BASE/lab-requests/$LAB_REQUEST_ID/report" "$LAB_TOKEN" \
  '{"reportUrl":"https://storage.example.com/reports/cbc-001.pdf"}'
check "TC-F-019" "Lab staff uploads diagnostic report" 201 "$HTTP_STATUS" "$RESPONSE_TIME"

req PUT "$BASE/doctors/me/availability" "$DOCTOR_TOKEN" '{"isAvailable":true}'
req POST "$BASE/appointments" "$PATIENT_TOKEN" \
  "{\"doctorId\":\"$DOCTOR_ID\",\"appointmentTime\":\"2026-04-01T10:00:00.000Z\",\"slotDuration\":15}"
check "TC-F-020" "Patient books appointment with available doctor" 201 "$HTTP_STATUS" "$RESPONSE_TIME"
APPOINTMENT_ID=$(jv "d['data']['id']")

req PUT "$BASE/appointments/$APPOINTMENT_ID/cancel" "$PATIENT_TOKEN" ""
check "TC-F-021" "Patient cancels appointment" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req POST "$BASE/medicines" "$ADMIN_TOKEN" \
  '{"name":"Test Medicine TC","stockQuantity":50,"unitPrice":3.50}'
check "TC-F-022" "Admin adds new medicine to inventory" 201 "$HTTP_STATUS" "$RESPONSE_TIME"
NEW_MED_ID=$(jv "d['data']['id']")

req PUT "$BASE/medicines/$NEW_MED_ID/stock" "$PHARMACY_TOKEN" '{"stockQuantity":150}'
check "TC-F-023" "Pharmacy updates medicine stock quantity" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

req POST "$BASE/patients/$PATIENT_ID/documents" "$DOCTOR_TOKEN" \
  '{"documentType":"LAB_REPORT","fileUrl":"https://storage.example.com/test-doc.pdf"}'
check "TC-F-024" "Doctor uploads external document for patient" 201 "$HTTP_STATUS" "$RESPONSE_TIME"

req GET "$BASE/patients/$PATIENT_ID/documents" "$DOCTOR_TOKEN" ""
check "TC-F-025" "View all external documents for patient" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

# ════════════════════════════════════════════════════════════════════
section "Negative Tests (TC-N-001 to TC-N-010)"

req POST "$BASE/auth/login" "" '{"ldapId":"nonexistent_user_xyz","password":"wrong"}'
check "TC-N-001" "Login with invalid ldapId → 401" 401 "$HTTP_STATUS" "$RESPONSE_TIME"

req GET "$BASE/patients/me" "" ""
check "TC-N-002" "Request without token → 401" 401 "$HTTP_STATUS" "$RESPONSE_TIME"

req GET "$BASE/prescriptions/pending" "$PATIENT_TOKEN" ""
check "TC-N-003" "Patient accessing pharmacy-only route → 403" 403 "$HTTP_STATUS" "$RESPONSE_TIME"

req POST "$BASE/visits/$VISIT_ID/bill" "$PATIENT_TOKEN" '{"items":[]}'
check "TC-N-004" "Patient attempting to generate bill → 403" 403 "$HTTP_STATUS" "$RESPONSE_TIME"

# Fresh visit for prescription empty-items test
req POST "$BASE/checkin" "$RECEPTION_TOKEN" '{"qrCode":"QR001","visitType":"OPD"}'
NEG_VISIT_ID=$(jv "d['data']['id']")
# Check doctor back in (checked out in F-014), then claim
req POST "$BASE/doctors/me/checkin" "$DOCTOR_TOKEN" "" > /dev/null 2>&1
req PUT "$BASE/visits/$NEG_VISIT_ID/claim" "$DOCTOR_TOKEN" "" > /dev/null 2>&1
req POST "$BASE/visits/$NEG_VISIT_ID/prescription" "$DOCTOR_TOKEN" '{"items":[]}'
check "TC-N-005" "Prescription with empty items array → 400" 400 "$HTTP_STATUS" "$RESPONSE_TIME"

# Insufficient stock: dedicated fresh visit so no pre-existing bill
req POST "$BASE/checkin" "$RECEPTION_TOKEN" '{"qrCode":"QR001","visitType":"OPD"}'
N6_VISIT_ID=$(jv "d['data']['id']")
req PUT "$BASE/medicines/$NEW_MED_ID/stock" "$ADMIN_TOKEN" '{"stockQuantity":0}'
req POST "$BASE/visits/$N6_VISIT_ID/bill" "$PHARMACY_TOKEN" \
  "{\"items\":[{\"medicineId\":\"$NEW_MED_ID\",\"quantity\":5}]}"
check "TC-N-006" "Bill with 0 stock (insufficient) → 400" 400 "$HTTP_STATUS" "$RESPONSE_TIME"

# VISIT_ID is COMPLETED — claiming must fail
req PUT "$BASE/visits/$VISIT_ID/claim" "$DOCTOR_TOKEN" ""
check "TC-N-007" "Claiming a COMPLETED visit → 400" 400 "$HTTP_STATUS" "$RESPONSE_TIME"

# VISIT_ID already has a prescription — duplicate rejected
req POST "$BASE/visits/$VISIT_ID/prescription" "$DOCTOR_TOKEN" \
  "{\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"dosage\":\"250mg\",\"duration\":\"1 day\"}]}"
check "TC-N-008" "Duplicate prescription for same visit → 409" 409 "$HTTP_STATUS" "$RESPONSE_TIME"

req PUT "$BASE/doctors/me/availability" "$DOCTOR_TOKEN" '{"isAvailable":false}'
req POST "$BASE/appointments" "$PATIENT_TOKEN" \
  "{\"doctorId\":\"$DOCTOR_ID\",\"appointmentTime\":\"2026-04-02T10:00:00.000Z\",\"slotDuration\":15,\"isEmergency\":false}"
check "TC-N-009" "Booking unavailable doctor (no emergency flag) → 400" 400 "$HTTP_STATUS" "$RESPONSE_TIME"

req POST "$BASE/checkin" "$RECEPTION_TOKEN" '{"qrCode":"INVALID_QR_DOES_NOT_EXIST","visitType":"OPD"}'
check "TC-N-010" "QR check-in with invalid QR code → 404" 404 "$HTTP_STATUS" "$RESPONSE_TIME"

# ════════════════════════════════════════════════════════════════════
section "Boundary Tests (TC-B-001 to TC-B-005)"

# NEG_VISIT_ID is IN_CONSULTATION — create prescription with exactly 1 item
req POST "$BASE/visits/$NEG_VISIT_ID/prescription" "$DOCTOR_TOKEN" \
  "{\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"dosage\":\"500mg\",\"duration\":\"1 day\"}]}"
check "TC-B-001" "Prescription with exactly 1 item (minimum valid) → 201" 201 "$HTTP_STATUS" "$RESPONSE_TIME"

# Stock = 3, bill with quantity = 3 (exactly at boundary)
req PUT "$BASE/medicines/$NEW_MED_ID/stock" "$ADMIN_TOKEN" '{"stockQuantity":3}'
req POST "$BASE/checkin" "$RECEPTION_TOKEN" '{"qrCode":"QR001","visitType":"OPD"}'
B2_VISIT_ID=$(jv "d['data']['id']")
req POST "$BASE/visits/$B2_VISIT_ID/bill" "$PHARMACY_TOKEN" \
  "{\"items\":[{\"medicineId\":\"$NEW_MED_ID\",\"quantity\":3}]}"
check "TC-B-002" "Bill with quantity = stock exactly (at boundary) → 201" 201 "$HTTP_STATUS" "$RESPONSE_TIME"

# Stock = 3, bill with quantity = 4 (one over boundary)
req PUT "$BASE/medicines/$NEW_MED_ID/stock" "$ADMIN_TOKEN" '{"stockQuantity":3}'
req POST "$BASE/checkin" "$RECEPTION_TOKEN" '{"qrCode":"QR001","visitType":"OPD"}'
B3_VISIT_ID=$(jv "d['data']['id']")
req POST "$BASE/visits/$B3_VISIT_ID/bill" "$PHARMACY_TOKEN" \
  "{\"items\":[{\"medicineId\":\"$NEW_MED_ID\",\"quantity\":4}]}"
check "TC-B-003" "Bill with quantity = stock + 1 (over boundary) → 400" 400 "$HTTP_STATUS" "$RESPONSE_TIME"

# Doctor unavailable (set in N-009) but isEmergency = true → must succeed
req POST "$BASE/appointments" "$PATIENT_TOKEN" \
  "{\"doctorId\":\"$DOCTOR_ID\",\"appointmentTime\":\"2026-04-03T10:00:00.000Z\",\"slotDuration\":15,\"isEmergency\":true}"
check "TC-B-004" "Emergency appointment bypasses unavailability → 201" 201 "$HTTP_STATUS" "$RESPONSE_TIME"

req PUT "$BASE/medicines/$NEW_MED_ID/stock" "$ADMIN_TOKEN" '{"stockQuantity":0}'
check "TC-B-005" "Update medicine stock to exactly 0 (valid lower boundary) → 200" 200 "$HTTP_STATUS" "$RESPONSE_TIME"

# ════════════════════════════════════════════════════════════════════
section "Performance / NFR Tests (TC-P-001 to TC-P-005)"
echo -e "  Thresholds: general ops < ${CYAN}3000ms${NC}, atomic ops < ${CYAN}5000ms${NC}  (SRS §5.1)"

T=3000
T_ATOMIC=5000

req POST "$BASE/auth/login" "" '{"ldapId":"doctor01","password":"anything"}'
[ "$RESPONSE_TIME" -le "$T" ] && TOK=true || TOK=false
check "TC-P-001" "Login response time < ${T}ms" 200 "$HTTP_STATUS" "$RESPONSE_TIME" "$TOK"

req GET "$BASE/patients/me" "$PATIENT_TOKEN" ""
[ "$RESPONSE_TIME" -le "$T" ] && TOK=true || TOK=false
check "TC-P-002" "Patient record retrieval < ${T}ms" 200 "$HTTP_STATUS" "$RESPONSE_TIME" "$TOK"

req GET "$BASE/visits/$VISIT_ID/prescription" "$PHARMACY_TOKEN" ""
[ "$RESPONSE_TIME" -le "$T" ] && TOK=true || TOK=false
check "TC-P-003" "Prescription retrieval < ${T}ms" 200 "$HTTP_STATUS" "$RESPONSE_TIME" "$TOK"

req PUT "$BASE/medicines/$NEW_MED_ID/stock" "$ADMIN_TOKEN" '{"stockQuantity":100}'
req POST "$BASE/checkin" "$RECEPTION_TOKEN" '{"qrCode":"QR001","visitType":"OPD"}'
P4_VISIT_ID=$(jv "d['data']['id']")
req POST "$BASE/visits/$P4_VISIT_ID/bill" "$PHARMACY_TOKEN" \
  "{\"items\":[{\"medicineId\":\"$NEW_MED_ID\",\"quantity\":1}]}"
[ "$RESPONSE_TIME" -le "$T_ATOMIC" ] && TOK=true || TOK=false
check "TC-P-004" "Bill generation (atomic + stock deduct) < ${T_ATOMIC}ms" 201 "$HTTP_STATUS" "$RESPONSE_TIME" "$TOK"

req POST "$BASE/checkin" "$RECEPTION_TOKEN" \
  '{"qrCode":"QR001","visitType":"OPD","vitals":{"weight":70,"temperature":98.4,"bloodPressure":"118/76"}}'
[ "$RESPONSE_TIME" -le "$T" ] && TOK=true || TOK=false
check "TC-P-005" "QR check-in (atomic visit + vitals) < ${T}ms" 201 "$HTTP_STATUS" "$RESPONSE_TIME" "$TOK"

# ════════════════════════════════════════════════════════════════════
echo
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
TOTAL=$((PASS+FAIL))
printf "  Total: %d  |  ${GREEN}Passed: %d${NC}  |  ${RED}Failed: %d${NC}\n" "$TOTAL" "$PASS" "$FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}All $TOTAL tests passed! ✓${NC}"
else
  echo -e "  ${RED}$FAIL test(s) failed — check output above.${NC}"
fi
echo -e "${YELLOW}══════════════════════════════════════════════════${NC}"
echo

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
