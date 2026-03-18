#!/usr/bin/env bash
# TC-F-003 → TC-F-019 : Full patient visit lifecycle
cd "$(dirname "$0")/../.." || exit 1
source tapes/scripts/setup.sh

echo
echo -e "${YELLOW}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Patient Visit Flow   ·   TC-F-003 → TC-F-019  ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════╝${NC}"

run_tc "TC-F-003" "Patient views own profile" \
  GET /patients/me \
  -H "Authorization: Bearer $PATIENT_TOKEN"

run_tc "TC-F-004" "Patient updates own profile" \
  PUT /patients/me \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999"}'

run_tc "TC-F-005" "Reception identifies patient by QR code" \
  GET /patients/qr/QR001 \
  -H "Authorization: Bearer $RECEPTION_TOKEN"

run_tc "TC-F-006" "QR check-in creates visit + vitals atomically" \
  POST /checkin \
  -H "Authorization: Bearer $RECEPTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"QR001","visitType":"OPD","vitals":{"weight":65.5,"temperature":98.6,"bloodPressure":"120/80"}}'
VISIT_ID=$(jv '.data.id')

run_tc "TC-F-007" "Doctor checks in (opens attendance record)" \
  POST /doctors/me/checkin \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

run_tc "TC-F-008" "Doctor views waiting patient queue" \
  GET /visits/my-queue \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

run_tc "TC-F-009" "Doctor claims visit (status → IN_CONSULTATION)" \
  PUT "/visits/$VISIT_ID/claim" \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

run_tc "TC-F-010" "Doctor saves consultation notes" \
  PUT "/visits/$VISIT_ID/consultation" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"consultationNotes":"Patient has mild fever. Prescribed paracetamol."}'

run_tc "TC-F-011" "Doctor creates digital prescription" \
  POST "/visits/$VISIT_ID/prescription" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"notes\":\"Take after meals\",\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"dosage\":\"500mg\",\"duration\":\"3 days\"}]}"
PRESCRIPTION_ID=$(jv '.data.id')

run_tc "TC-F-012" "Doctor requests lab test" \
  POST "/visits/$VISIT_ID/lab-requests" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testName":"CBC - Complete Blood Count"}'
LAB_ID=$(jv '.data.id')

run_tc "TC-F-013" "Doctor completes visit (status → COMPLETED)" \
  PUT "/visits/$VISIT_ID/complete" \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

run_tc "TC-F-014" "Doctor checks out (closes attendance, computes hours)" \
  POST /doctors/me/checkout \
  -H "Authorization: Bearer $DOCTOR_TOKEN"

run_tc "TC-F-015" "Pharmacy views undispensed prescription queue" \
  GET /prescriptions/pending \
  -H "Authorization: Bearer $PHARMACY_TOKEN"

run_tc "TC-F-016" "Pharmacy dispenses prescription" \
  PUT "/prescriptions/$PRESCRIPTION_ID/dispense" \
  -H "Authorization: Bearer $PHARMACY_TOKEN"

run_tc "TC-F-017" "Pharmacy generates bill with atomic stock deduction" \
  POST "/visits/$VISIT_ID/bill" \
  -H "Authorization: Bearer $PHARMACY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"medicineId\":\"$MEDICINE_ID\",\"quantity\":2}]}"
BILL_ID=$(jv '.data.id')

run_tc "TC-F-018" "Pharmacy marks bill as paid" \
  PUT "/bills/$BILL_ID/pay" \
  -H "Authorization: Bearer $PHARMACY_TOKEN"

run_tc "TC-F-019" "Lab staff uploads diagnostic report" \
  POST "/lab-requests/$LAB_ID/report" \
  -H "Authorization: Bearer $LAB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportUrl":"https://storage.example.com/reports/cbc-001.pdf"}'

echo
echo -e "${GREEN}✓ TC-F-003 → TC-F-019 complete${NC}"
echo
