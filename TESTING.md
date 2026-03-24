# PHC System — Testing Guide

> Keep this file updated as new routes and modules are added.
> Every developer should be able to follow this guide from zero to a fully working test run.

---

## 1. Automated Test Script

For a quick full-system verification, run the automated test suite:

```bash
cd backend
bash smoke_test.sh
# or with a custom URL:
bash smoke_test.sh http://localhost:8000/api/v1
```

This runs all 53 test cases (functional, negative, boundary, performance, repeatability) automatically and prints a Pass/Fail result for each. Requires the server to be running and the DB to be seeded first (steps 3–5 below).

---

## 2. Prerequisites

- Node.js v20+
- npm
- A **Prisma Postgres** cloud database (see setup below)
- [Bruno](https://www.usebruno.com/) — the API client used for this project (free, open-source)

---

## 2. Database Setup (Prisma Cloud)

1. Go to [console.prisma.io](https://console.prisma.io) and sign in
2. Create a new **Prisma Postgres** project
3. Copy the connection string — it looks like:
   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=...
   ```
4. Paste it as `DATABASE_URL` in your `.env`

---

## 3. First-Time Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.example .env
# Open .env and fill in:
#   DATABASE_URL=<your prisma cloud connection string>
#   JWT_SECRET=any-long-random-string

# 3. Run migrations — creates all tables in the cloud DB
npx prisma migrate dev --name "initial-schema"

# 4. Seed the database with test users and medicines
npm run seed

# 5. Start the server
npm run dev
# → http://localhost:8000
```

> If the migrations folder already exists (other devs have run it before),
> `npx prisma migrate dev` with no name will apply any pending ones.

---

## 4. Seed Script

The seed script creates all test users, their role profiles, and two test medicines.
It is **safe to run multiple times** — it skips records that already exist.

```bash
# From the backend/ directory
npm run seed
```

What gets created:

| ldapId | Role | Profile data |
|--------|------|-------------|
| `doctor01` | `DOCTOR` | Dr. Sharma, PHYSICIAN, available |
| `reception01` | `RECEPTION_STAFF` | thin profile |
| `patient01` | `PATIENT` | Rahul Verma, QR code: QR001, blood group B+ |
| `pharmacy01` | `PHARMACY_STAFF` | thin profile |
| `lab01` | `LAB_STAFF` | thin profile |
| `admin01` | `ADMIN` | no profile table (role only) |

| Medicine | Stock | Unit price |
|----------|-------|-----------|
| Paracetamol 500mg | 200 | ₹2.50 |
| Amoxicillin 250mg | 100 | ₹8.00 |

---

## 5. Bruno API Collection

All API requests are pre-built as a Bruno collection. No manual setup needed — just open the folder.

### Opening the collection

1. Download and install [Bruno](https://www.usebruno.com/) (free)
2. Open Bruno → click **Open Collection**
3. Navigate to `backend/tests/iitj-phc-system/` inside this repo and select that folder
4. The collection opens with 13 folders — one per module:

```
Auth/           — Login, Get current user
Patient/        — Profile, QR lookup, Visit history
Doctor/         — List, Availability, Check-in/out, Attendance
Visit/          — Create, Queue, Vitals, Claim, Consult, Complete, Cancel
Prescription/   — Create, View, Pending queue, Dispense
Lab/            — Request test, View requests, Pending queue, Upload report
Medicine/       — List, Get single, Add, Update stock
Billing/        — Generate bill, View bill, List unpaid, Mark paid
Appointment/    — List for doctor, Book, My appointments, Cancel
Checkin/        — QR check-in (creates visit atomically)
Document/       — Upload, List patient documents
Admin/          — User management, events, usage/attendance reports
Events/         — Public upcoming PHC event listing
```

### Updating tokens

The tokens stored in each request file are from a previous session and will be expired.
Before sending any request, get a fresh token:

1. Open **Auth → Login and get a token**
2. Change `ldapId` in the body to the role you need (`doctor01`, `reception01`, etc.)
3. Send the request → copy the `token` value from the response
4. Open the request you want to test → edit the `Authorization` header value to `Bearer <your token>`

> Each role has its own token. If you switch from `doctor01` to `pharmacy01`, log in again as `pharmacy01` and paste that token into the pharmacy requests.

### Replacing placeholder IDs

Requests that operate on a specific record use placeholder strings in the URL:

| Placeholder | What to replace it with |
|-------------|------------------------|
| `PATIENT_PROFILE_ID` | `id` from `GET /patients/qr/QR001` response |
| `DOCTOR_PROFILE_ID` | `id` from `GET /doctors` response |
| `VISIT_ID` | `id` from `POST /visits` or `POST /checkin` response |
| `PRESCRIPTION_ID` | `id` from `POST /visits/.../prescription` response |
| `LAB_REQUEST_ID` | `id` from `POST /visits/.../lab-requests` response |
| `MEDICINE_ID` | `id` from `GET /medicines` response |
| `BILL_ID` | `id` from `POST /visits/.../bill` response |
| `APPOINTMENT_ID` | `id` from `POST /appointments` response |
| `USER_ID` | `id` from `POST /admin/users` response |
| `PATIENT_QR_CODE` | `QR001` (seeded) or from patient profile |

Edit the URL directly in Bruno before sending.

### Recommended testing flow

Follow the smoke test order in §19 using Bruno. A typical session looks like:

```
1. Auth/Login and get a token       → ldapId: "reception01" → copy token
2. Patient/Identify patient by QR   → paste reception01 token → copy patientId
3. Visit/Reception creates visit    → paste patientId in body, paste token → copy visitId

4. Auth/Login and get a token       → ldapId: "doctor01" → copy token
5. Doctor/Doctor checks in          → paste doctor01 token
6. Visit/Doctor views waiting queue → confirms visit is there
7. Visit/Doctor claims visit        → paste visitId in URL
8. Visit/Doctor saves consultation  → paste visitId in URL
9. Prescription/Doctor creates prescription → paste visitId, medicineId
10. Lab/Doctor requests lab test    → paste visitId
11. Visit/Doctor completes visit    → paste visitId
12. Doctor/Doctor checks out

13. Auth/Login and get a token      → ldapId: "pharmacy01" → copy token
14. Prescription/Pharmacy views pending prescriptions
15. Prescription/Pharmacy dispenses prescription → paste prescriptionId in URL

16. Auth/Login and get a token      → ldapId: "lab01" → copy token
17. Lab/Lab staff views pending requests
18. Lab/Lab staff uploads report    → paste labRequestId in URL
19. Patient/Patient views own lab reports
20. Admin/Admin creates user
21. Admin/Admin publishes PHC event
```

---

## 6. Do You Need to Reset the DB Between Test Runs?

**No — you do not need to reset the DB between test runs.**

- The seed script is idempotent. Re-running it only skips existing records; it won't create duplicates.
- Visits, prescriptions, and lab requests created during testing stay in the DB. That's fine — each test run creates new ones, so leftover data from previous runs doesn't interfere.
- The server keeps working against the same DB across sessions.

**The only cases where you'd want to reset:**

| Situation | What to do |
|-----------|-----------|
| Schema changed (new migration) | Run `npx prisma migrate dev` — adds only the new changes, does **not** drop existing data |
| Want a completely clean slate | Run `npx prisma migrate reset` — **drops all data**, re-runs all migrations, then re-seeds automatically |
| Doctor is still checked in from a previous test run | Call `POST /doctors/me/checkout` (logged in as `doctor01`) before starting a new smoke test |

> `npx prisma migrate reset` is the nuclear option. It wipes everything and re-seeds.
> Don't use it unless you genuinely need a blank DB.

To inspect the DB at any time:
```bash
npx prisma studio
# Opens at http://localhost:5555 — connects to your cloud DB
```

---

## 7. Auth

> **Base URL for all routes:** `http://localhost:8000/api/v1`
>
> Dev mode (`LDAP_URL` not set in `.env`) — **any password is accepted**,
> the system only checks that the `ldapId` exists in the User table.

### Login and get a token
```
POST /auth/login
Content-Type: application/json

{ "ldapId": "doctor01", "password": "anything" }
```
Response:
```json
{
  "statusCode": 200,
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "ldapId": "doctor01", "role": "DOCTOR" }
  }
}
```

Save the token. Every request after this needs:
```
Authorization: Bearer <token>
```

### Get current user info
```
GET /auth/me
```

---

## 8. Patient Routes

> Staff routes: login as `reception01` or `doctor01`
> Patient routes: login as `patient01`

### Patient views own profile
```
GET /patients/me
# Role: PATIENT
```

### Patient updates own profile
```
PUT /patients/me
# Role: PATIENT
Body: { "phone": "9999999999", "bloodGroup": "O+" }
```

### Identify patient by QR code (reception desk)
```
GET /patients/qr/QR001
# Role: RECEPTION_STAFF
```

### View a patient's full record
```
GET /patients/<patient profile id>
# Role: DOCTOR, RECEPTION_STAFF, ADMIN
# Note: use the Patient table id, NOT the User id
```

### View a patient's visit history
```
GET /patients/<patient profile id>/visits
# Role: DOCTOR, RECEPTION_STAFF, ADMIN, PATIENT
```

---

## 9. Doctor Routes

### List available doctors
```
GET /doctors
# Role: any authenticated user
```

### View a specific doctor
```
GET /doctors/<doctor profile id>
# Role: any authenticated user
```

### Doctor sets their availability
```
PUT /doctors/me/availability
# Role: DOCTOR
Body: { "isAvailable": true }
```

### Doctor checks in (opens attendance, marks available)
```
POST /doctors/me/checkin
# Role: DOCTOR
```

### Doctor checks out (closes attendance, computes hours)
```
POST /doctors/me/checkout
# Role: DOCTOR
```

### Admin views all attendance records
```
GET /doctors/attendance/records
# Role: ADMIN
# Optional query: ?doctorId=<id> to filter by doctor
```

---

## 10. Visit Lifecycle

> Full flow: **create → vitals → claim → consultation → prescription → lab request → complete**

### 10.1 Reception creates a visit
```
POST /visits
# Role: RECEPTION_STAFF
Body:
{
  "patientId": "<patient profile id>",
  "visitType": "OPD",
  "vitals": {
    "weight": 68.5,
    "temperature": 98.6,
    "bloodPressure": "120/80"
  }
}
```
> Save the `id` from the response — this is your `visitId` for everything below.

`visitType` options: `OPD` | `ADMIT` | `EMERGENCY`

### 10.2 Add/update vitals separately
```
POST /visits/<visitId>/vitals
# Role: RECEPTION_STAFF
Body: { "weight": 70, "temperature": 99.1, "bloodPressure": "118/76" }
```

### 10.3 Doctor's waiting queue
```
GET /visits/my-queue
# Role: DOCTOR
# Returns all WAITING visits assigned to this doctor
```

### 10.4 Doctor claims the visit
```
PUT /visits/<visitId>/claim
# Role: DOCTOR
# Status: WAITING → IN_CONSULTATION. Locks visit to this doctor.
```

### 10.5 Doctor saves consultation notes
```
PUT /visits/<visitId>/consultation
# Role: DOCTOR (must be the assigned doctor)
Body: { "consultationNotes": "Patient has mild fever. Prescribed paracetamol." }
```

### 10.6 Get full visit record
```
GET /visits/<visitId>
# Role: DOCTOR, RECEPTION_STAFF, PHARMACY_STAFF, LAB_STAFF, ADMIN
```

### 10.7 Cancel a visit
```
PUT /visits/<visitId>/cancel
# Role: DOCTOR, RECEPTION_STAFF, ADMIN
# Works on WAITING or IN_CONSULTATION visits only
```

### 10.8 Doctor completes the visit
```
PUT /visits/<visitId>/complete
# Role: DOCTOR (must be the assigned doctor)
# Status: IN_CONSULTATION → COMPLETED. Sets closedAt.
```

---

## 11. Prescription Routes

### Doctor creates a prescription
```
POST /visits/<visitId>/prescription
# Role: DOCTOR (must be assigned to this visit)
Body:
{
  "notes": "Take after meals",
  "items": [
    {
      "medicineId": "<paracetamol medicine id>",
      "dosage": "500mg",
      "duration": "3 days"
    }
  ]
}
```
> One prescription per visit — creating a second one returns `409`.

### View the prescription for a visit
```
GET /visits/<visitId>/prescription
# Role: DOCTOR, PHARMACY_STAFF, PATIENT, ADMIN
```

### Pharmacy views all undispensed prescriptions
```
GET /prescriptions/pending
# Role: PHARMACY_STAFF, ADMIN
```

### Pharmacy marks prescription as dispensed
```
PUT /prescriptions/<prescriptionId>/dispense
# Role: PHARMACY_STAFF
```

---

## 12. Lab Routes

### Doctor requests a lab test
```
POST /visits/<visitId>/lab-requests
# Role: DOCTOR (must be assigned to this visit)
Body: { "testName": "CBC - Complete Blood Count" }
```

### View all lab requests for a visit
```
GET /visits/<visitId>/lab-requests
# Role: DOCTOR, PATIENT, LAB_STAFF, ADMIN
```

### View a single lab request and uploaded report
```
GET /lab-requests/<labRequestId>
# Role: DOCTOR, PATIENT, LAB_STAFF, ADMIN
```

### Lab staff views all pending test orders
```
GET /lab-requests/pending
# Role: LAB_STAFF, ADMIN
```

### Lab staff uploads a report
```
POST /lab-requests/<labRequestId>/report
# Role: LAB_STAFF
Body: { "reportUrl": "https://storage.example.com/reports/cbc-001.pdf" }
```

---

## 13. Medicine Routes

> Any authenticated user can list medicines. Admin adds. Pharmacy restocks.

### List all medicines
```
GET /medicines
# Role: any authenticated user
```

### Get a specific medicine
```
GET /medicines/<medicineId>
# Role: any authenticated user
```

### Admin adds a medicine
```
POST /medicines
# Role: ADMIN
Body: { "name": "Ibuprofen 400mg", "stockQuantity": 200, "unitPrice": 5.00 }
```

### Pharmacy updates stock
```
PUT /medicines/<medicineId>/stock
# Role: PHARMACY_STAFF, ADMIN
Body: { "stockQuantity": 150 }
```

---

## 14. Billing Routes

### Pharmacy generates a bill
```
POST /visits/<visitId>/bill
# Role: PHARMACY_STAFF, ADMIN
Body:
{
  "items": [
    { "medicineId": "<id>", "quantity": 2 }
  ]
}
```
> Atomically deducts stock. Returns `400` if any item has insufficient stock.
> One bill per visit — second attempt returns `409`.

### View bill for a visit
```
GET /visits/<visitId>/bill
# Role: PHARMACY_STAFF, DOCTOR, PATIENT, ADMIN
```

### List all unpaid bills
```
GET /bills/unpaid
# Role: PHARMACY_STAFF, ADMIN
```

### Mark a bill as paid
```
PUT /bills/<billId>/pay
# Role: PHARMACY_STAFF, ADMIN
```

---

## 15. Appointment Routes

### List appointments for a doctor
```
GET /doctors/<doctorId>/appointments
# Role: any authenticated user
```

### Book an appointment (as patient)
```
POST /appointments
# Role: PATIENT
Body: { "doctorId": "<id>", "appointmentTime": "2026-03-20T10:00:00.000Z", "slotDuration": 15 }
```
> Add `"isEmergency": true` to bypass doctor unavailability check.

### Book on behalf of patient (as reception)
```
POST /appointments
# Role: RECEPTION_STAFF
Body: { "patientId": "<id>", "doctorId": "<id>", "appointmentTime": "...", "slotDuration": 15 }
```

### Patient views own appointments
```
GET /appointments/my
# Role: PATIENT
```

### Doctor views own appointments
```
GET /doctors/me/appointments
# Role: DOCTOR
```

### Cancel an appointment
```
PUT /appointments/<appointmentId>/cancel
# Role: PATIENT, RECEPTION_STAFF, ADMIN
```

---

## 16. QR Check-In Route

> Combines patient lookup + visit creation in one atomic call. Preferred flow at the reception desk.

```
POST /checkin
# Role: RECEPTION_STAFF
Body:
{
  "qrCode": "QR001",
  "visitType": "OPD",
  "vitals": {
    "weight": 65.5,
    "temperature": 98.6,
    "bloodPressure": "120/80"
  }
}
```
> `vitals` is optional. `visitType` must be `OPD` | `ADMIT` | `EMERGENCY`.
> Returns the created visit with patient info.

---

## 17. External Document Routes

### Upload a document for a patient
```
POST /patients/<patientId>/documents
# Role: DOCTOR, RECEPTION_STAFF, PATIENT, ADMIN
Body:
{
  "documentType": "LAB_REPORT",
  "fileUrl": "https://storage.example.com/reports/abc123.pdf",
  "visitId": "<visitId>"   ← optional
}
```
> `documentType` must be `PRESCRIPTION` | `LAB_REPORT` | `DISCHARGE`.

### List all documents for a patient
```
GET /patients/<patientId>/documents
# Role: DOCTOR, RECEPTION_STAFF, PATIENT, ADMIN
```

---

## 18. Admin & Events Routes

### Admin creates a managed user
```
POST /admin/users
# Role: ADMIN
Body:
{
  "ldapId": "doctor02",
  "role": "DOCTOR",
  "profile": {
    "name": "Dr. Mehta",
    "doctorType": "SPECIALIST",
    "specialization": "Dermatology",
    "isAvailable": false
  }
}
```

### Admin lists users with filters
```
GET /admin/users?role=DOCTOR&isActive=true
# Role: ADMIN
# Optional filters: role, isActive, ldapId
```

### Admin updates or deactivates a user
```
PUT /admin/users/<userId>
# Role: ADMIN
Body: { "isActive": false }
```

### Admin publishes a PHC event
```
POST /admin/events
# Role: ADMIN
Body:
{
  "title": "Blood Donation Camp",
  "description": "Campus-wide donor registration and screening.",
  "eventDate": "2026-04-02T10:00:00.000Z"
}
```

### Public list of upcoming PHC events
```
GET /events
# Role: public
```

### Admin usage and attendance reports
```
GET /admin/reports/usage
GET /admin/reports/attendance
# Role: ADMIN
```

---

## 19. End-to-End Smoke Test

Run these in order. Swap tokens between role logins. Replace all `<ids>` with values from actual responses.

```
1.  POST  /auth/login                                { ldapId: "reception01" }
2.  POST  /checkin                                   { qrCode: "QR001", visitType: "OPD", vitals: {...} } → copy visitId, patientId

3.  POST  /auth/login                                { ldapId: "doctor01" }
4.  POST  /doctors/me/checkin
5.  GET   /visits/my-queue
6.  PUT   /visits/<visitId>/claim
7.  PUT   /visits/<visitId>/consultation             { consultationNotes: "..." }
8.  GET   /medicines                                 → copy medicineId (Paracetamol 500mg)
9.  POST  /visits/<visitId>/prescription             { items: [{ medicineId, dosage: "500mg", duration: "3 days" }] } → copy prescriptionId
10. POST  /visits/<visitId>/lab-requests             { testName: "CBC" } → copy labRequestId
11. PUT   /visits/<visitId>/complete
12. POST  /doctors/me/checkout

13. POST  /auth/login                                { ldapId: "pharmacy01" }
14. GET   /prescriptions/pending
15. PUT   /prescriptions/<prescriptionId>/dispense
16. POST  /visits/<visitId>/bill                     { items: [{ medicineId, quantity: 2 }] } → copy billId
17. GET   /bills/unpaid
18. PUT   /bills/<billId>/pay

19. POST  /auth/login                                { ldapId: "lab01" }
20. GET   /lab-requests/pending
21. POST  /lab-requests/<labRequestId>/report        { reportUrl: "https://..." }
22. GET   /lab-requests/<labRequestId>               (patient or doctor token)

23. POST  /auth/login                                { ldapId: "admin01" }
24. POST  /admin/users                               { ldapId: "<unique>", role: "DOCTOR", profile: {...} } → copy userId
25. GET   /admin/users?ldapId=<unique>
26. PUT   /admin/users/<userId>                      { isActive: false }
27. POST  /admin/events                              { title: "...", eventDate: "..." }
28. GET   /events
29. GET   /admin/reports/usage
30. GET   /admin/reports/attendance
```

All 30 steps should return `200` or `201` with no errors.
Stock for Paracetamol 500mg starts at 200 — billing step 16 will decrement it by 2.

---

## 20. Expected HTTP Status Codes

| Scenario | Code |
|----------|------|
| Successful fetch | `200` |
| Successful creation | `201` |
| Missing or invalid fields | `400` |
| No token / expired token | `401` |
| Wrong role for this endpoint | `403` |
| Record not found | `404` |
| Already exists (duplicate) | `409` |

---

## 21. Common Mistakes

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized request` | No auth header | Add `Authorization: Bearer <token>` |
| `403 Access denied` | Wrong role | Re-login with the correct role account |
| `404 Doctor profile not found` | User row exists but no Doctor row | Re-run `npm run seed` |
| `404 Patient not found` | Passing User `id` instead of Patient `id` | Use the Patient table's `id`, not User's |
| `400 Already checked in` | Checkin called twice (leftover from previous test run) | Call `POST /doctors/me/checkout` first |
| `409 Prescription already exists` | Created twice for same visit | One prescription per visit only |
| `400 Visit is not in WAITING state` | Trying to claim a non-WAITING visit | Check current visit status first |
| `400 doctorType must be one of ...` | Creating/updating a doctor user without `doctorType` | Provide `doctorType: "SPECIALIST"` or `"PHYSICIAN"` |
| `400 Cannot change role for ... existing records` | Admin attempted to role-switch a user with linked clinical/audit data | Deactivate the account instead of changing role |
| `501 LDAP integration not configured` | `LDAP_URL` is set in `.env` | Leave `LDAP_URL` blank for dev mode |
| Prisma Studio shows empty tables | Migration not run | Run `npx prisma migrate dev` |
| Seed script fails with connection error | `DATABASE_URL` not set | Check `.env` has the correct `prisma+postgres://` URL |
| Bruno token gives `401` | Token expired | Re-login and paste fresh token into the request |

---

## 22. Updating This File

When a new module/route is added:
1. Add a new numbered section with: method, path, required role, request body, and what to save from the response
2. Add the relevant step(s) to the smoke test in §19
3. Add the Bruno request files under `backend/tests/iitj-phc-system/<Folder>/`
4. Add any new gotchas to §21

---

---

## Appendix: Local PostgreSQL Setup (alternative to Prisma Cloud)

Only needed if you can't use Prisma Cloud (e.g. offline development).

```bash
# Ubuntu/Debian
sudo apt install postgresql

sudo -u postgres psql <<SQL
CREATE DATABASE phc_dev;
CREATE USER phc_user WITH PASSWORD 'phc_pass';
GRANT ALL PRIVILEGES ON DATABASE phc_dev TO phc_user;
SQL
```

Then set in `.env`:
```
DATABASE_URL=postgresql://phc_user:phc_pass@localhost:5432/phc_dev
```

Everything else in this guide works the same. Note that Prisma Studio
connecting to a local DB doesn't need `?sslmode=require`.
