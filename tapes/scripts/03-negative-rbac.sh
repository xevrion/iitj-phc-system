#!/usr/bin/env bash
# TC-N-001 → TC-N-010 : All negative / RBAC tests
cd "$(dirname "$0")/../.." || exit 1
source tapes/scripts/setup.sh

echo
echo -e "${YELLOW}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Negative / RBAC Tests  ·  TC-N-001 → TC-N-010 ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════╝${NC}"

# ── Prepare state needed for stateful negative tests ──────────────
printf "  Preparing test state ..."

curl -s -X POST "$BASE/doctors/me/checkin" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null 2>&1

NEG_VISIT_ID=$(curl -s -X POST "$BASE/checkin" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"QR001","visitType":"OPD"}' | jq -r '.data.id')

curl -s -X PUT "$BASE/visits/$NEG_VISIT_ID/claim" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null 2>&1
curl -s -X POST "$BASE/visits/$NEG_VISIT_ID/prescription" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"notes\":\"test\",\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"dosage\":\"500mg\",\"duration\":\"1 day\"}]}" > /dev/null 2>&1
curl -s -X PUT "$BASE/visits/$NEG_VISIT_ID/complete" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null 2>&1

# Fresh IN_CONSULTATION visit for N-005 (empty items)
NEG5_VISIT_ID=$(curl -s -X POST "$BASE/checkin" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"QR001","visitType":"OPD"}' | jq -r '.data.id')
curl -s -X PUT "$BASE/visits/$NEG5_VISIT_ID/claim" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null 2>&1

# Fresh visit for N-006 (insufficient stock)
NEG6_VISIT_ID=$(curl -s -X POST "$BASE/checkin" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"QR001","visitType":"OPD"}' | jq -r '.data.id')

# Set stock to 0 and doctor unavailable
curl -s -X PUT "$BASE/medicines/$MEDICINE_ID/stock" \
  -H "Authorization: Bearer $PHARMACY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stockQuantity":0}' > /dev/null 2>&1
curl -s -X PUT "$BASE/doctors/me/availability" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isAvailable":false}' > /dev/null 2>&1

echo -e " ${GREEN}done${NC}"

# ── Tests ─────────────────────────────────────────────────────────

run_tc "TC-N-001" "Login with invalid ldapId → 401" 401 \
  POST /auth/login \
  -H "Content-Type: application/json" \
  -d '{"ldapId":"nonexistent_user_xyz","password":"anything"}'

run_tc "TC-N-002" "Request without Authorization header → 401" 401 \
  GET /auth/me

run_tc "TC-N-003" "Patient accessing pharmacy-only route → 403" 403 \
  GET /prescriptions/pending \
  -H "Authorization: Bearer $PATIENT_TOKEN"

run_tc "TC-N-004" "Patient attempting to generate bill → 403" 403 \
  POST "/visits/$NEG_VISIT_ID/bill" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"quantity\":1}]}"

run_tc "TC-N-005" "Prescription with empty items array → 400" 400 \
  POST "/visits/$NEG5_VISIT_ID/prescription" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[]}'

run_tc "TC-N-006" "Bill with insufficient stock → 400" 400 \
  POST "/visits/$NEG6_VISIT_ID/bill" \
  -H "Authorization: Bearer $PHARMACY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"quantity\":5}]}"

run_tc "TC-N-007" "Claiming a COMPLETED visit → 400" 400 \
  PUT "/visits/$NEG_VISIT_ID/claim" \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

run_tc "TC-N-008" "Duplicate prescription for same visit → 409" 409 \
  POST "/visits/$NEG_VISIT_ID/prescription" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"notes\":\"dup\",\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"dosage\":\"500mg\",\"duration\":\"1 day\"}]}"

run_tc "TC-N-009" "Booking unavailable doctor without emergency flag → 400" 400 \
  POST /appointments \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"doctorId\":\"$DOCTOR_ID\",\"appointmentTime\":\"2026-05-10T10:00:00.000Z\",\"slotDuration\":15,\"isEmergency\":false}"

run_tc "TC-N-010" "QR check-in with invalid QR code → 404" 404 \
  POST /checkin \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"INVALID_QR_XYZ","visitType":"OPD"}'

echo
echo -e "${GREEN}✓ TC-N-001 → TC-N-010 complete${NC}"
echo
