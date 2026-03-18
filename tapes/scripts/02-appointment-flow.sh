#!/usr/bin/env bash
# TC-F-020, TC-F-021, TC-N-009, TC-B-004 : Appointment booking & edge cases
cd "$(dirname "$0")/../.." || exit 1
source tapes/scripts/setup.sh

echo
echo -e "${YELLOW}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Appointment Flow                               ║${NC}"
echo -e "${YELLOW}║   TC-F-020  TC-F-021  TC-N-009  TC-B-004        ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════════════╝${NC}"

# Doctor is available (setup.sh ensures this)
run_tc "TC-F-020" "Patient books appointment with available doctor" 201 \
  POST /appointments \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"doctorId\":\"$DOCTOR_ID\",\"appointmentTime\":\"2026-05-01T10:00:00.000Z\",\"slotDuration\":15}"
APPOINTMENT_ID=$(jv '.data.id')

run_tc "TC-F-021" "Patient cancels appointment" 200 \
  PUT "/appointments/$APPOINTMENT_ID/cancel" \
  -H "Authorization: Bearer $PATIENT_TOKEN"

# Make doctor unavailable for the next two tests
curl -s -X PUT "$BASE/doctors/me/availability" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isAvailable":false}' > /dev/null 2>&1
echo -e "\n  ${CYAN}(doctor set to unavailable for TC-N-009 and TC-B-004)${NC}"

run_tc "TC-N-009" "Booking unavailable doctor without emergency flag → 400" 400 \
  POST /appointments \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"doctorId\":\"$DOCTOR_ID\",\"appointmentTime\":\"2026-05-02T10:00:00.000Z\",\"slotDuration\":15,\"isEmergency\":false}"

run_tc "TC-B-004" "Emergency booking bypasses unavailability → 201" 201 \
  POST /appointments \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"doctorId\":\"$DOCTOR_ID\",\"appointmentTime\":\"2026-05-03T10:00:00.000Z\",\"slotDuration\":15,\"isEmergency\":true}"

echo
echo -e "${GREEN}✓ Appointment flow tests complete${NC}"
echo
