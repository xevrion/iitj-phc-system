# PHC Backend API Documentation

Current route index for the implementation checked on April 18, 2026.

Base URL: `http://localhost:8000/api/v1`

## Response Envelope

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
  - Returns a JWT in `data.token`
- `GET /auth/me`
  - Any authenticated user
  - Returns the current user plus available profile data

When `LDAP_URL` is unset, dev mode accepts any password for an existing `ldapId`.

## Route Index

### Healthcheck

- `GET /healthcheck`

### Patients

- `GET /patients/me`
- `PUT /patients/me`
- `GET /patients/me/lab-reports`
- `GET /patients/qr/:qrCode`
- `GET /patients/:id`
- `GET /patients/:id/visits`

### Doctors

- `GET /doctors`
- `PUT /doctors/me/availability`
- `POST /doctors/me/checkin`
- `POST /doctors/me/checkout`
- `GET /doctors/me/appointments`
- `GET /doctors/me/attendance`
- `GET /doctors/attendance/records`
- `POST /doctors/:id/absence`
- `GET /doctors/:id`
- `GET /doctors/:id/appointments`

### Visits

- `POST /visits`
- `GET /visits/my-queue`
- `GET /visits/live-queue`
- `GET /visits/my-current`
- `GET /visits/:id`
- `POST /visits/:id/vitals`
- `PUT /visits/:id/claim`
- `PUT /visits/:id/consultation`
- `PUT /visits/:id/complete`
- `PUT /visits/:id/cancel`

### Prescriptions

- `POST /visits/:visitId/prescription`
- `GET /visits/:visitId/prescription`
- `GET /prescriptions/pending`
- `GET /prescriptions/history`
- `PUT /prescriptions/:id/dispense`

### Laboratory

- `POST /visits/:visitId/lab-requests`
- `GET /visits/:visitId/lab-requests`
- `GET /lab-requests/pending`
- `GET /lab-requests/:id`
- `POST /lab-requests/:id/report`

`POST /lab-requests/:id/report` is a multipart upload route and requires a real file.

### Medicines

- `GET /medicines`
- `GET /medicines/:id`
- `POST /medicines`
- `PUT /medicines/:id/stock`

### Billing

- `POST /visits/:visitId/bill`
- `GET /visits/:visitId/bill`
- `GET /bills/mine`
- `GET /bills/unpaid`
- `PUT /bills/:billId/pay`

### Appointments

- `GET /appointments`
- `POST /appointments`
- `GET /appointments/my`
- `PUT /appointments/:id/cancel`
- `GET /doctors/:id/appointments`
- `GET /doctors/me/appointments`

### Check-in

- `POST /checkin`

### Documents

- `POST /patients/:id/documents`
- `GET /patients/:id/documents`
- `DELETE /patients/:id/documents/:docId`

The document upload service accepts either:
- multipart upload with a `file` field
- JSON with `fileUrl`

### Notifications

- `GET /notifications/mine`
- `PUT /notifications/:id/read`

### Admin

- `POST /admin/users`
- `GET /admin/users`
- `PUT /admin/users/:id`
- `POST /admin/events`
- `GET /admin/reports/usage`
- `GET /admin/reports/attendance`

### Public Events

- `GET /events`

## Verification Commands

From `backend/`:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run test:unit
npm run test:rbac
npm run test:e2e
bash smoke_test.sh
```

Notes:
- `test:e2e` and `smoke_test.sh` require Cloudinary env vars because they exercise upload-backed routes
- `test:load` expects a separately running backend server
