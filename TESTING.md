# PHC System — Setup, Testing, and Exploration Guide

This guide is for a new developer or evaluator who wants to run the IITJ PHC System from scratch, verify the backend, and explore the frontend dashboards role by role.

The system now includes:
- backend API
- React frontend
- role-based dashboards
- Cloudinary-backed medical vault uploads
- Cloudinary-backed lab report uploads
- Sprint 7 hardening and validation scripts

---

## 1. What You Need

- Node.js `v20+`
- npm
- Docker and Docker Compose
- a PostgreSQL database
  - Prisma Postgres works well and is what the repo documents
- Cloudinary account
  - required for patient vault uploads and lab report uploads

Optional but useful:
- Bruno for API exploration
- Prisma Studio for database inspection

---

## 2. Repo Services and Ports

- frontend: `http://localhost:5173`
- backend API: `http://localhost:8000/api/v1`
- backend healthcheck: `http://localhost:8000/api/v1/healthcheck`
- LDAP dev service: started through Docker Compose

---

## 3. First-Time Local Setup

### 3.1 Start LDAP

From the repo root:

```bash
docker compose up -d ldap
```

### 3.2 Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill `backend/.env` with at least:

```env
DATABASE_URL=your_database_url
JWT_SECRET=any-long-random-string
CORS_ORIGIN=http://localhost:5173

LDAP_URL=ldap://127.0.0.1:1389
LDAP_BASE_DN=dc=iitj,dc=ac,dc=in
LDAP_USERS_OU=ou=users

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=iitj-phc-system/medical-documents
```

Optional Sprint 7 hardening values:

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
AUTH_RATE_LIMIT_WINDOW_MS=600000
AUTH_RATE_LIMIT_MAX_REQUESTS=20
ENFORCE_HTTPS=false
```

Run DB setup:

```bash
npx prisma migrate dev --name "initial-schema"
npm run seed
```

Start backend:

```bash
npm run dev
```

### 3.3 Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 4. Seeded Login Accounts

Use these on the frontend login page or against `/auth/login`.

| ldapId | Role | Password |
|--------|------|----------|
| `doctor01` | `DOCTOR` | `doctor01pass` |
| `reception01` | `RECEPTION_STAFF` | `reception01pass` |
| `patient01` | `PATIENT` | `patient01pass` |
| `pharmacy01` | `PHARMACY_STAFF` | `pharmacy01pass` |
| `lab01` | `LAB_STAFF` | `lab01pass` |
| `admin01` | `ADMIN` | `admin01pass` |

Seeded patient details:
- patient: `Rahul Verma`
- QR code: `QR001`

Seeded medicines:
- `Paracetamol 500mg`
- `Amoxicillin 250mg`

---

## 5. Frontend Routes by Role

After login, users are redirected automatically based on role.

### Patient

- `/patient`
- `/patient/appointments`
- `/patient/appointments/book`
- `/patient/visits`
- `/patient/prescriptions`
- `/patient/lab-reports`
- `/patient/vault`
- `/patient/billing`
- `/patient/profile`

### Doctor

- `/doctor`
- `/doctor/queue`
- `/doctor/appointments`
- `/doctor/profile`

### Reception

- `/reception-staff`
- `/reception-staff/checkin`
- `/reception-staff/patients`
- `/reception-staff/appointments`

### Lab

- `/lab-staff`

### Pharmacy

- `/pharmacy-staff`
- `/pharmacy-staff/inventory`

### Admin

- `/admin`
- user/event/report screens are available through the admin dashboard routes

---

## 6. Automated Validation Commands

Run these from `backend/`.

### Full smoke suite

```bash
bash smoke_test.sh
```

Or with a custom API base URL:

```bash
bash smoke_test.sh http://localhost:8000/api/v1
```

### Full core integration flow

```bash
npm run test:e2e
```

### RBAC smoke checks

```bash
npm run test:rbac
```

### Core service unit-style tests

```bash
npm run test:unit
```

### Lightweight concurrent load check

This expects a running backend server.

```bash
npm run test:load
```

Optional overrides:

```bash
LOAD_TEST_BASE_URL=http://localhost:8000/api/v1 \
LOAD_TEST_CONCURRENCY=20 \
LOAD_TEST_ITERATIONS=5 \
npm run test:load
```

### Production migration path

```bash
npx prisma migrate deploy
```

### Seed data

```bash
npm run seed
```

---

## 7. Recommended “Does Everything Work?” Check

Use this order:

1. Start LDAP
2. Start backend
3. Start frontend
4. Log in to the frontend with each role once
5. Run:
   - `npm run test:unit`
   - `npm run test:e2e`
   - `npm run test:rbac`
   - `npm run test:load`
6. Manually verify the dashboard flows below

---

## 8. Manual Frontend Exploration by Role

### 8.1 Reception Flow

Login as `reception01`.

Check:
- `/reception-staff` shows the live queue for today only
- available doctors list loads
- patient check-in works using QR `QR001`
- new visit appears in the reception live queue
- reception appointments page loads and sorts cleanly

Expected behavior:
- queue shows only current-day active visits
- cancelled appointments sit separately / lower than active slots
- reception can create appointments and cancel them

### 8.2 Doctor Flow

Login as `doctor01`.

Check:
- `/doctor` loads without `Dr. Dr. ...` duplication
- attendance and availability are separate
- `Check In / Check Out` controls daily attendance
- `Open Consultations / Pause Consultations` controls active availability
- `/doctor/queue` shows waiting patients
- `/doctor/appointments` separates:
  - upcoming booked slots
  - cancelled slots
  - past booked appointments

Expected behavior:
- doctor cannot open consultations before checking in
- checking out ends attendance and marks doctor unavailable

### 8.3 Patient Flow

Login as `patient01`.

Check:
- `/patient` shows current PHC status if the patient is in queue
- `/patient/appointments` shows booked appointments
- `/patient/lab-reports` opens actual uploaded reports
- `/patient/vault` uploads files to Cloudinary
- deleting a vault document also deletes it from Cloudinary
- `/patient/billing` shows generated bills

Expected behavior:
- current queue status comes from active visit, not booked appointment
- lab reports should not show the old placeholder messaging

### 8.4 Lab Flow

Login as `lab01`.

Check:
- pending requests load
- upload modal accepts `PDF`, `PNG`, `JPG`
- upload sends a real file, not a pasted URL

Expected behavior:
- uploaded report is stored via Cloudinary-backed URL flow
- patient can later open that report from `/patient/lab-reports`

### 8.5 Pharmacy Flow

Login as `pharmacy01`.

Check:
- pending prescriptions load
- `Generate Bill` creates unpaid bill and deducts stock
- `Mark Paid` settles the bill
- `Dispense` is only available after payment
- unpaid bills show useful context:
  - patient
  - visit
  - medicines
  - totals
  - timestamps

Expected behavior:
- dispensing is not the same as bill generation
- stock should reduce when the bill is generated

### 8.6 Admin Flow

Login as `admin01`.

Check:
- user management loads
- reports load
- events can be published

Expected behavior:
- admin can create/deactivate users
- attendance summary and usage report endpoints respond

---

## 9. API Exploration with Bruno

Bruno collection path:

```text
backend/tests/iitj-phc-system/
```

### Open it

1. Install Bruno
2. Open collection
3. Select `backend/tests/iitj-phc-system/`

### Important note

The stored bearer tokens in the collection are stale. Always log in first and replace the token manually.

### Common placeholders

| Placeholder | Replace with |
|-------------|--------------|
| `PATIENT_PROFILE_ID` | patient `id` from `GET /patients/qr/QR001` |
| `DOCTOR_PROFILE_ID` | doctor `id` from `GET /auth/me` as doctor or `GET /doctors` |
| `VISIT_ID` | created visit id |
| `PRESCRIPTION_ID` | created prescription id |
| `LAB_REQUEST_ID` | created lab request id |
| `MEDICINE_ID` | medicine id from `GET /medicines` |
| `BILL_ID` | generated bill id |
| `APPOINTMENT_ID` | created appointment id |
| `USER_ID` | admin-created user id |
| `NOTIFICATION_ID` | notification id from `GET /notifications/mine` |

---

## 10. Cloudinary Notes

Cloudinary is used for:
- patient vault uploads
- lab report uploads

If uploads succeed but opening PDFs returns `401`, check the Cloudinary product environment setting that allows PDF delivery.

If you change Cloudinary env vars:
1. update `backend/.env`
2. restart backend

---

## 11. Useful Developer Commands

From `backend/`:

```bash
npx prisma studio
```

```bash
npx prisma generate
```

```bash
npx prisma migrate dev --name "<change-name>"
```

```bash
npx prisma migrate deploy
```

From `frontend/`:

```bash
npm run build
```

---

## 12. Common Problems

### Backend not reachable

Symptom:
- frontend shows `Failed to load ...`
- console shows `ERR_CONNECTION_REFUSED`

Fix:
- start backend with `npm run dev`

### Login fails for valid seeded users

Check:
- LDAP container is running
- seed has been executed

Commands:

```bash
docker compose up -d ldap
cd backend
npm run seed
```

### Cloudinary upload works but PDF view fails

Likely cause:
- Cloudinary PDF delivery restriction/settings

Fix:
- enable PDF delivery in the Cloudinary console

### Doctor cannot open consultations

Expected if:
- doctor is not checked in

Correct flow:
1. check in
2. open consultations

### Sidebar moves with long page content

This was fixed. The dashboard sidebar should now stay pinned while the right pane scrolls.

---

## 13. Reset / Cleanup Notes

Usually you do not need a full reset.

### To reseed safely

```bash
cd backend
npm run seed
```

### To apply new migrations without wiping data

```bash
cd backend
npx prisma migrate dev
```

### Nuclear reset

Only do this if you truly want to wipe all local DB data:

```bash
cd backend
npx prisma migrate reset
```

### Doctor stuck as checked in

If a previous run left `doctor01` checked in:

```bash
POST /api/v1/doctors/me/checkout
```

You can do this from Bruno or by logging in as the doctor and using the UI.

---

## 14. Suggested Demo Order

For a clean project walkthrough:

1. Reception creates a visit for `QR001`
2. Doctor checks in and opens consultations
3. Doctor claims visit, writes notes, prescription, lab request
4. Pharmacy generates bill and marks it paid
5. Lab uploads report
6. Patient checks queue status, appointments, billing, vault, lab reports
7. Admin shows user management and reports

Also see:
- [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md)
- [DEMO_CHECKLIST.md](DEMO_CHECKLIST.md)
