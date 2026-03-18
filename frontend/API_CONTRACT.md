# IITJ PHC Backend API Contract (Extracted from Code)

Base URL: `/api/v1`

## Auth Model
- Auth type: JWT Bearer token.
- Login response includes token in body (`data.token`); backend also checks cookie `accessToken` if present.
- Protected routes use `verifyJWT` middleware.
- Role authorization uses `authorizeRoles(...)`.

## Standard Response Envelope
Success:
```json
{
  "statusCode": 200,
  "data": {},
  "message": "...",
  "success": true
}
```
Error:
```json
{
  "statusCode": 400,
  "message": "...",
  "success": false,
  "errors": []
}
```

## Endpoints

### Public
- `GET /healthcheck`
  - Response `data`: `{ status: "OK", message: "Server is healthy" }`
- `POST /auth/login`
  - Body: `{ ldapId: string, password: string }`
  - Response `data`: `{ token: string, user: { id, ldapId, role, isActive } }`
  - Errors: `400` missing fields, `401` invalid/deactivated, `501` if LDAP URL configured (placeholder not implemented).

### Authenticated
- `GET /auth/me`
  - Response `data`: user profile + role relation (`patient`/`doctor`) summary.

### Patients
- `GET /patients/me` (PATIENT)
- `PUT /patients/me` (PATIENT)
  - Body allowed keys only: `name, dob, email, bloodGroup, phone, address`
- `GET /patients/qr/:qrCode` (RECEPTION_STAFF, ADMIN)
- `GET /patients/:id` (DOCTOR, ADMIN, RECEPTION_STAFF)
- `GET /patients/:id/visits` (DOCTOR, ADMIN, RECEPTION_STAFF, PATIENT)
  - Note: code does not enforce `PATIENT` ownership check.

### Doctors
- `GET /doctors` (any authenticated)
- `GET /doctors/:id` (any authenticated)
- `PUT /doctors/me/availability` (DOCTOR)
  - Body: `{ isAvailable: boolean }`
- `POST /doctors/me/checkin` (DOCTOR)
- `POST /doctors/me/checkout` (DOCTOR)
- `GET /doctors/me/appointments` (DOCTOR)
- `GET /doctors/attendance/records?doctorId=` (ADMIN)
- `GET /doctors/:id/appointments` (any authenticated)

### Appointments
- `POST /appointments` (PATIENT, RECEPTION_STAFF)
  - PATIENT body: `{ doctorId, appointmentTime, slotDuration, isEmergency? }`
  - RECEPTION_STAFF body: `{ doctorId, patientId, appointmentTime, slotDuration, isEmergency? }`
- `GET /appointments/my` (PATIENT)
- `PUT /appointments/:id/cancel` (PATIENT, RECEPTION_STAFF, ADMIN)

### Visits
- `POST /visits` (RECEPTION_STAFF, ADMIN)
  - Body: `{ patientId, doctorId?, visitType, vitals? }`
- `GET /visits/my-queue` (DOCTOR)
- `GET /visits/:id` (DOCTOR, ADMIN, RECEPTION_STAFF, PHARMACY_STAFF, LAB_STAFF)
- `POST /visits/:id/vitals` (RECEPTION_STAFF, ADMIN)
- `PUT /visits/:id/claim` (DOCTOR)
- `PUT /visits/:id/consultation` (DOCTOR)
  - Body: `{ consultationNotes }`
- `PUT /visits/:id/complete` (DOCTOR)
- `PUT /visits/:id/cancel` (RECEPTION_STAFF, ADMIN, DOCTOR)

### Prescriptions
- `POST /visits/:visitId/prescription` (DOCTOR)
  - Body: `{ notes?, items: [{ medicineId, dosage?, duration? }] }`
- `GET /visits/:visitId/prescription` (DOCTOR, PHARMACY_STAFF, PATIENT, ADMIN)
- `GET /prescriptions/pending` (PHARMACY_STAFF, ADMIN)
- `PUT /prescriptions/:id/dispense` (PHARMACY_STAFF)

### Lab
- `POST /visits/:visitId/lab-requests` (DOCTOR)
  - Body: `{ testName }`
- `GET /visits/:visitId/lab-requests` (DOCTOR, PATIENT, LAB_STAFF, ADMIN)
- `GET /lab-requests/pending` (LAB_STAFF, ADMIN)
- `POST /lab-requests/:id/report` (LAB_STAFF)
  - Body: `{ reportUrl }`

### Medicines
- `GET /medicines` (any authenticated)
- `GET /medicines/:id` (any authenticated)
- `POST /medicines` (ADMIN)
  - Body: `{ name, stockQuantity, unitPrice }`
- `PUT /medicines/:id/stock` (PHARMACY_STAFF, ADMIN)
  - Body: `{ stockQuantity }`

### Billing
- `POST /visits/:visitId/bill` (PHARMACY_STAFF, ADMIN)
  - Body: `{ items: [{ medicineId, quantity }] }`
- `GET /visits/:visitId/bill` (PHARMACY_STAFF, DOCTOR, PATIENT, ADMIN)
- `GET /bills/unpaid` (PHARMACY_STAFF, ADMIN)
- `PUT /bills/:billId/pay` (PHARMACY_STAFF, ADMIN)

### Check-in
- `POST /checkin` (RECEPTION_STAFF)
  - Body: `{ qrCode, visitType, vitals? }`

### Documents
- `POST /patients/:id/documents` (DOCTOR, RECEPTION_STAFF, PATIENT, ADMIN)
  - Body: `{ documentType: PRESCRIPTION|LAB_REPORT|DISCHARGE, fileUrl, visitId? }`
- `GET /patients/:id/documents` (DOCTOR, RECEPTION_STAFF, PATIENT, ADMIN)

## Key Edge Cases / Risks Found
- No ownership guard for several PATIENT-accessible resources (e.g., `GET /patients/:id/visits`, `GET /visits/:visitId/prescription`, `GET /visits/:visitId/lab-requests`, `GET /visits/:visitId/bill`, `/patients/:id/documents`).
- `/doctors/:id/appointments` has no explicit role guard; inherits any-authenticated access.
- Login may return `501` when LDAP URL is set because integration is marked TODO.
- Billing and prescription workflows correctly block duplicates and validate inventory/medicine existence.
