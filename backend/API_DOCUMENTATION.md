# PHC Backend API Documentation

Route index and integration notes for the Sprint 5 backend.

Base URL: `http://localhost:8000/api/v1`

## Response envelope

Successful responses use:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Human-readable message",
  "success": true
}
```

Errors are normalized by the global error handler into the same shape.

## Authentication

- `POST /auth/login`
  - Public
  - Body: `{ "ldapId": "doctor01", "password": "anything" }`
  - Returns JWT token plus current user role.
- `GET /auth/me`
  - Any authenticated user
  - Returns the current user plus role-specific profile data when present.

In development mode, any password is accepted if the `ldapId` exists. Real LDAP bind behavior activates only when `LDAP_URL` is configured.

## Module route index

### Patient

- `GET /patients/me`
- `PUT /patients/me`
- `GET /patients/me/lab-reports`
- `GET /patients/qr/:qrCode`
- `GET /patients/:id`
- `GET /patients/:id/visits`

### Doctor

- `GET /doctors`
- `GET /doctors/:id`
- `PUT /doctors/me/availability`
- `POST /doctors/me/checkin`
- `POST /doctors/me/checkout`
- `GET /doctors/me/appointments`
- `GET /doctors/attendance/records`
- `POST /doctors/:id/absence`
  - Reception staff or admin marks a physician unavailable using an absence form.
  - Body: `{ "reason": "On approved leave" }`
- `GET /doctors/:id/appointments`

### Notifications

- `GET /notifications/mine`
  - Any authenticated user.
  - Returns notifications created by specialist unavailability or physician absence broadcasts.
- `PUT /notifications/:id/read`
  - Marks one notification as read for the current user.

### Visit lifecycle

- `POST /visits`
- `GET /visits/my-queue`
- `GET /visits/:id`
- `POST /visits/:id/vitals`
- `PUT /visits/:id/claim`
- `PUT /visits/:id/consultation`
- `PUT /visits/:id/complete`
- `PUT /visits/:id/cancel`

### Prescription

- `POST /visits/:visitId/prescription`
- `GET /visits/:visitId/prescription`
- `GET /prescriptions/pending`
- `PUT /prescriptions/:id/dispense`

### Laboratory

- `POST /visits/:visitId/lab-requests`
- `GET /visits/:visitId/lab-requests`
- `GET /lab-requests/pending`
- `GET /lab-requests/:id`
- `POST /lab-requests/:id/report`

### Medicine and billing

- `GET /medicines`
- `GET /medicines/:id`
- `POST /medicines`
- `PUT /medicines/:id/stock`
- `POST /visits/:visitId/bill`
- `GET /visits/:visitId/bill`
- `GET /bills/unpaid`
- `PUT /bills/:id/pay`

### Appointment

- `POST /appointments`
- `POST /appointments/staff`
- `GET /appointments/my`
- `PUT /appointments/:id/cancel`
- `GET /doctors/:id/appointments`
- `GET /doctors/me/appointments`

### Check-in and documents

- `POST /checkin`
- `POST /patients/:id/documents`
- `GET /patients/:id/documents`

### Admin and events

- `POST /admin/users`
- `GET /admin/users`
- `PUT /admin/users/:id`
- `POST /admin/events`
- `GET /admin/reports/usage`
- `GET /admin/reports/attendance`
- `GET /events`

## Integration commands

From `backend/`:

```bash
npm run seed
npm run test:e2e
bash smoke_test.sh
npm run migrate:deploy
```

## Full backend flow covered by `npm run test:e2e`

The end-to-end script performs:

1. role logins,
2. doctor readiness and availability reset,
3. patient QR lookup and check-in,
4. doctor claim and consultation,
5. prescription creation,
6. lab request creation and report upload,
7. bill generation and payment,
8. final patient-visible lab verification,
9. doctor checkout.

This command is the most direct verification of Sprint 5 backend integration because it boots the app in-process and drives the HTTP API against the configured database.
