# PHC System — Testing Guide

> Keep this file updated as new routes and modules are added.
> Every developer should be able to follow this guide from zero to a fully working test run.

---

## 1. Prerequisites

- Node.js v20+
- npm
- A **Prisma Postgres** cloud database (see setup below)
- Postman, Bruno, or any HTTP client for hitting routes

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

# 4. Start the server
npm run dev
# → http://localhost:8000
```

> If the migrations folder already exists (other devs have run it before),
> `npx prisma migrate dev` with no name will apply any pending ones.

---

## 4. Seeding Test Data

No seed script yet — use **Prisma Studio** to manually insert records:

```bash
npx prisma studio
# Opens at http://localhost:5555 — connects to your cloud DB
```

### Records to create (do this in order)

#### User table — one row per test user
| ldapId | role | isActive |
|--------|------|----------|
| `doctor01` | `DOCTOR` | `true` |
| `reception01` | `RECEPTION_STAFF` | `true` |
| `patient01` | `PATIENT` | `true` |
| `pharmacy01` | `PHARMACY_STAFF` | `true` |
| `lab01` | `LAB_STAFF` | `true` |
| `admin01` | `ADMIN` | `true` |

> After creating each User row, copy its `id` (UUID) — you'll need it for the profile tables below.

#### Profile tables — link each user to their role-specific data

**Doctor**
| userId | name | doctorType | isAvailable |
|--------|------|------------|-------------|
| `<doctor01 id>` | `Dr. Sharma` | `PHYSICIAN` | `true` |

**Patient**
| userId | name | qrCode | bloodGroup | phone |
|--------|------|--------|------------|-------|
| `<patient01 id>` | `Rahul Verma` | `QR001` | `B+` | `9876543210` |

**ReceptionStaff** — just the userId field
| userId |
|--------|
| `<reception01 id>` |

**PharmacyStaff**
| userId |
|--------|
| `<pharmacy01 id>` |

**LabStaff**
| userId |
|--------|
| `<lab01 id>` |

**Medicine** (needed before creating prescriptions)
| name | stockQuantity | unitPrice |
|------|---------------|-----------|
| `Paracetamol 500mg` | `200` | `2.50` |
| `Amoxicillin 250mg` | `100` | `8.00` |

---

## 5. Auth

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

## 6. Patient Routes

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

## 7. Doctor Routes

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

## 8. Visit Lifecycle

> Full flow: **create → vitals → claim → consultation → prescription → lab request → complete**

### 8.1 Reception creates a visit
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

### 8.2 Add/update vitals separately
```
POST /visits/<visitId>/vitals
# Role: RECEPTION_STAFF
Body: { "weight": 70, "temperature": 99.1, "bloodPressure": "118/76" }
```

### 8.3 Doctor's waiting queue
```
GET /visits/my-queue
# Role: DOCTOR
# Returns all WAITING visits assigned to this doctor
```

### 8.4 Doctor claims the visit
```
PUT /visits/<visitId>/claim
# Role: DOCTOR
# Status: WAITING → IN_CONSULTATION. Locks visit to this doctor.
```

### 8.5 Doctor saves consultation notes
```
PUT /visits/<visitId>/consultation
# Role: DOCTOR (must be the assigned doctor)
Body: { "consultationNotes": "Patient has mild fever. Prescribed paracetamol." }
```

### 8.6 Get full visit record
```
GET /visits/<visitId>
# Role: DOCTOR, RECEPTION_STAFF, PHARMACY_STAFF, LAB_STAFF, ADMIN
```

### 8.7 Cancel a visit
```
PUT /visits/<visitId>/cancel
# Role: DOCTOR, RECEPTION_STAFF, ADMIN
# Works on WAITING or IN_CONSULTATION visits only
```

### 8.8 Doctor completes the visit
```
PUT /visits/<visitId>/complete
# Role: DOCTOR (must be the assigned doctor)
# Status: IN_CONSULTATION → COMPLETED. Sets closedAt.
```

---

## 9. Prescription Routes

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

## 10. Lab Routes

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

## 11. End-to-End Smoke Test

Run these in order. Swap tokens between role logins. Replace all `<ids>` with values from actual responses.

```
1.  POST  /auth/login                                { ldapId: "reception01" }
2.  GET   /patients/qr/QR001                         → copy patientId
3.  POST  /visits                                    { patientId, visitType: "OPD", vitals: {...} } → copy visitId

4.  POST  /auth/login                                { ldapId: "doctor01" }
5.  POST  /doctors/me/checkin
6.  GET   /visits/my-queue
7.  PUT   /visits/<visitId>/claim
8.  PUT   /visits/<visitId>/consultation             { consultationNotes: "..." }
9.  POST  /visits/<visitId>/prescription             { items: [{ medicineId, dosage, duration }] } → copy prescriptionId
10. POST  /visits/<visitId>/lab-requests             { testName: "CBC" } → copy labRequestId
11. PUT   /visits/<visitId>/complete
12. POST  /doctors/me/checkout

13. POST  /auth/login                                { ldapId: "pharmacy01" }
14. GET   /prescriptions/pending
15. PUT   /prescriptions/<prescriptionId>/dispense

16. POST  /auth/login                                { ldapId: "lab01" }
17. GET   /lab-requests/pending
18. POST  /lab-requests/<labRequestId>/report        { reportUrl: "https://..." }
```

All 18 steps should return `200` or `201` with no errors.

---

## 12. Expected HTTP Status Codes

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

## 13. Common Mistakes

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized request` | No auth header | Add `Authorization: Bearer <token>` |
| `403 Access denied` | Wrong role | Re-login with the correct role account |
| `404 Doctor profile not found` | User row exists but no Doctor row | Add a Doctor row in Prisma Studio |
| `404 Patient not found` | Passing User `id` instead of Patient `id` | Use the Patient table's `id`, not User's |
| `400 Already checked in` | Checkin called twice | Call `/doctors/me/checkout` first |
| `409 Prescription already exists` | Created twice for same visit | One prescription per visit only |
| `400 Visit is not in WAITING state` | Trying to claim a non-WAITING visit | Check current visit status first |
| `501 LDAP integration not configured` | `LDAP_URL` is set in `.env` | Leave `LDAP_URL` blank for dev mode |
| Prisma Studio shows empty tables | Migration not run | Run `npx prisma migrate dev` |

---

## 14. Updating This File

When a new module/route is added:
1. Add a new numbered section with: method, path, required role, request body, and what to save from the response
2. Add the relevant step(s) to the smoke test in section 11
3. Add any new gotchas to section 13

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
