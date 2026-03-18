#!/usr/bin/env bash
# TC-P-001 → TC-P-005 + TC-R-001 → TC-R-003 : Performance & repeatability
cd "$(dirname "$0")/../.." || exit 1
source tapes/scripts/setup.sh

echo
echo -e "${YELLOW}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Performance / NFR  +  Repeatability           ║${NC}"
echo -e "${YELLOW}║   TC-P-001→005  ·  TC-R-001→003                 ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════╝${NC}"

# ── Prepare: create a completed visit + prescription for TC-P-003/004 ─
printf "  Preparing test data ..."
curl -s -X POST "$BASE/doctors/me/checkin" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null 2>&1

PERF_VISIT_ID=$(curl -s -X POST "$BASE/checkin" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"QR001","visitType":"OPD"}' | jq -r '.data.id')
curl -s -X PUT "$BASE/visits/$PERF_VISIT_ID/claim" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null 2>&1
curl -s -X POST "$BASE/visits/$PERF_VISIT_ID/prescription" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"notes\":\"perf test\",\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"dosage\":\"500mg\",\"duration\":\"1 day\"}]}" > /dev/null 2>&1
curl -s -X PUT "$BASE/visits/$PERF_VISIT_ID/complete" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" > /dev/null 2>&1
echo -e " ${GREEN}done${NC}"

echo
echo -e "${YELLOW}──────────────────────────────────────────────────${NC}"
echo -e "  ${YELLOW}Performance / NFR Tests  (threshold: < 3000ms general, < 5000ms atomic)${NC}"
echo -e "${YELLOW}──────────────────────────────────────────────────${NC}"

perf_tc "TC-P-001" "Login response time < 3000ms" 200 3000 \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"ldapId":"patient01","password":"anything"}'

perf_tc "TC-P-002" "Patient record retrieval < 3000ms" 200 3000 \
  "$BASE/patients/me" \
  -H "Authorization: Bearer $PATIENT_TOKEN"

perf_tc "TC-P-003" "Prescription retrieval < 3000ms" 200 3000 \
  "$BASE/visits/$PERF_VISIT_ID/prescription" \
  -H "Authorization: Bearer $PHARMACY_TOKEN"

perf_tc "TC-P-004" "Atomic bill generation < 5000ms" 201 5000 \
  -X POST "$BASE/visits/$PERF_VISIT_ID/bill" \
  -H "Authorization: Bearer $PHARMACY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"quantity\":1}]}"

perf_tc "TC-P-005" "Atomic QR check-in < 3000ms" 201 3000 \
  -X POST "$BASE/checkin" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"QR001","visitType":"OPD","vitals":{"weight":70,"temperature":98.4,"bloodPressure":"118/76"}}'

echo
echo -e "${YELLOW}──────────────────────────────────────────────────${NC}"
echo -e "  ${YELLOW}Repeatability / Stability Tests  (15 runs each, threshold: < 3000ms)${NC}"
echo -e "${YELLOW}──────────────────────────────────────────────────${NC}"

repeat_tc "TC-R-001" "Login endpoint consistent < 3000ms" 15 3000 \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"ldapId":"patient01","password":"anything"}'

repeat_tc "TC-R-002" "Patient profile retrieval consistent < 3000ms" 15 3000 \
  "$BASE/patients/me" \
  -H "Authorization: Bearer $PATIENT_TOKEN"

repeat_tc "TC-R-003" "Atomic QR check-in consistent < 3000ms" 15 3000 \
  -X POST "$BASE/checkin" \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"QR001","visitType":"OPD"}'

echo
echo -e "${GREEN}✓ Performance + Repeatability tests complete${NC}"
echo
