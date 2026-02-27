# PHC System — Testing Guide

> Keep this file updated as new routes and modules are added.
> Every developer should be able to follow this guide from zero to a fully working test run.

---

## 1. Prerequisites

- Node.js v20+
- npm
- A PostgreSQL database — either:
  - **Prisma Postgres (cloud):** sign up at [prisma.io/postgres](https://prisma.io/postgres), create a project, copy the connection string.
  - **Local PostgreSQL:** see setup below.

### Local PostgreSQL setup (if not using cloud)
```bash
sudo apt install postgresql          # Ubuntu/Debian
sudo -u postgres psql <<SQL
CREATE DATABASE phc_dev;
CREATE USER phc_user WITH PASSWORD 'phc_pass';
GRANT ALL PRIVILEGES ON DATABASE phc_dev TO phc_user;
SQL
# DATABASE_URL = postgresql://phc_user:phc_pass@localhost:5432/phc_dev
```

---

## 2. First-Time Setup

```bash
# 1. Clone and install
cd backend
npm install

# 2. Create your .env from the template
cp .env.example .env
# Edit .env — fill in DATABASE_URL and JWT_SECRET at minimum

# 3. Apply all migrations to create the DB tables
npx prisma migrate dev --name "initial-schema"
# (If migrations folder already exists, just run: npx prisma migrate dev)

# 4. Start the dev server
npm run dev
# Server running at http://localhost:8000
```

---

## 3. Seeding Test Data

No seed script exists yet — create records manually via **Prisma Studio**:

```bash
npx prisma studio     # opens browser at http://localhost:5555
```

### Minimum records needed for full flow testing

#### Step 1 — Create User rows (User table)
| ldapId | role | isActive |
|--------|------|----------|
| `doctor01` | `DOCTOR` | `true` |
| `reception01` | `RECEPTION_STAFF` | `true` |
| `patient01` | `PATIENT` | `true` |
| `pharmacy01` | `PHARMACY_STAFF` | `true` |
| `lab01` | `LAB_STAFF` | `true` |
| `admin01` | `ADMIN` | `true` |

> Copy each `id` (UUID) after creating — you'll need it for profile rows.

#### Step 2 — Create profile rows

**Doctor table:**
| userId | name | doctorType | isAvailable |
|--------|------|------------|-------------|
| `<doctor01 user id>` | `Dr. Sharma` | `PHYSICIAN` | `true` |

**Patient table:**
| userId | name | qrCode | bloodGroup | phone |
|--------|------|--------|------------|-------|
| `<patient01 user id>` | `Rahul Verma` | `QR001` | `B+` | `9876543210` |

**ReceptionStaff table:**
| userId |
|--------|
| `<reception01 user id>` |

**PharmacyStaff table:**
| userId |
|--------|
| `<pharmacy01 user id>` |

**LabStaff table:**
| userId |
|--------|
| `<lab01 user id>` |

**Medicine table** (needed before prescriptions):
| name | stockQuantity | unitPrice |
|------|---------------|-----------|
| `Paracetamol 500mg` | `200` | `2.50` |
| `Amoxicillin 250mg` | `100` | `8.00` |

---

## 4. Auth

> **Base URL:** `http://localhost:8000/api/v1`
>
> In dev mode (`LDAP_URL` not set), **any password is accepted** as long as the `ldapId` exists in the User table.

### Login
```
POST /auth/login
Content-Type: application/json

{ "ldapId": "doctor01", "password": "anything" }
```
**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "ldapId": "doctor01", "role": "DOCTOR" }
  }
}
```
Save the token. Add to all subsequent requests:
```
Authorization: Bearer <token>
```

### Get current user
```
GET /auth/me
Authorization: Bearer <token>
```

---

## 5. Patient Routes

Login as `reception01` or `doctor01` for staff routes. Login as `patient01` for patient-only routes.

### Patient views own profile
```
GET /patients/me
# Login as patient01
```

### Patient updates own profile
```
PUT /patients/me
# Login as patient01
Body: { "phone": "9999999999", "bloodGroup": "O+" }
```

### QR-based identification (reception desk)
```
GET /patients/qr/QR001
# Login as reception01
```

### View patient record (staff)
```
GET /patients/<patient profile id>
# Login as doctor01 or reception01
```

### Patient visit history
```
GET /patients/<patient profile id>/visits
# Login as doctor01, reception01, or patient01
```

---

## 6. Doctor Routes

### List available doctors
```
GET /doctors
# Any logged-in user
```

### Doctor sets availability
```
PUT /doctors/me/availability
# Login as doctor01
Body: { "isAvailable": true }
```

### Doctor check-in (opens attendance record)
```
POST /doctors/me/checkin
# Login as doctor01
```

### Doctor check-out (closes record, computes hours)
```
POST /doctors/me/checkout
# Login as doctor01
```

### Admin views attendance records
```
GET /doctors/attendance/records
# Login as admin01
```

---

## 7. Visit Lifecycle

> Full flow: create → vitals → claim → consultation → prescription → lab request → complete

### 7.1 Reception creates a visit
```
POST /visits
# Login as reception01
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
> Save the `id` from the response — this is your `visitId`.

### 7.2 Add/update vitals separately
```
POST /visits/<visitId>/vitals
# Login as reception01
Body: { "weight": 70, "temperature": 99.1, "bloodPressure": "118/76" }
```

### 7.3 Doctor's queue
```
GET /visits/my-queue
# Login as doctor01
# Shows all WAITING visits assigned to this doctor
```

### 7.4 Doctor claims the visit
```
PUT /visits/<visitId>/claim
# Login as doctor01
# Sets status → IN_CONSULTATION, assigns doctor
```

### 7.5 Doctor saves consultation notes
```
PUT /visits/<visitId>/consultation
# Login as doctor01
Body: { "consultationNotes": "Patient presents with fever. Prescribed paracetamol." }
```

### 7.6 Get full visit record
```
GET /visits/<visitId>
# Login as doctor01 / reception01 / pharmacy01 / lab01
```

### 7.7 Cancel a visit
```
PUT /visits/<visitId>/cancel
# Login as reception01 or doctor01
# Works on WAITING or IN_CONSULTATION visits only
```

### 7.8 Doctor completes the visit
```
PUT /visits/<visitId>/complete
# Login as doctor01
# Sets status → COMPLETED, sets closedAt timestamp
```

---

## 8. Prescription Routes

### Doctor creates prescription (do this before completing the visit)
```
POST /visits/<visitId>/prescription
# Login as doctor01
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

### View prescription
```
GET /visits/<visitId>/prescription
# Login as doctor01, pharmacy01, or patient01
```

### Pharmacy views undispensed queue
```
GET /prescriptions/pending
# Login as pharmacy01
```

### Pharmacy marks prescription as dispensed
```
PUT /prescriptions/<prescriptionId>/dispense
# Login as pharmacy01
```

---

## 9. Lab Routes

### Doctor requests a lab test
```
POST /visits/<visitId>/lab-requests
# Login as doctor01
Body: { "testName": "CBC - Complete Blood Count" }
```

### View lab requests for a visit
```
GET /visits/<visitId>/lab-requests
# Login as doctor01, lab01, or patient01
```

### Lab staff views pending orders
```
GET /lab-requests/pending
# Login as lab01
```

### Lab staff uploads report
```
POST /lab-requests/<labRequestId>/report
# Login as lab01
Body: { "reportUrl": "https://storage.example.com/reports/cbc-001.pdf" }
```

---

## 10. End-to-End Happy Path (quick smoke test)

Run these in order using Postman or Bruno. Replace all `<ids>` from actual responses.

```
1.  POST   /auth/login                          (reception01)
2.  GET    /patients/qr/QR001                   (reception01) → get patientId
3.  POST   /visits                              (reception01) → get visitId
4.  POST   /auth/login                          (doctor01)
5.  POST   /doctors/me/checkin                  (doctor01)
6.  GET    /visits/my-queue                     (doctor01)
7.  PUT    /visits/<visitId>/claim              (doctor01)
8.  PUT    /visits/<visitId>/consultation       (doctor01)
9.  POST   /visits/<visitId>/prescription       (doctor01) → get prescriptionId
10. POST   /visits/<visitId>/lab-requests       (doctor01) → get labRequestId
11. PUT    /visits/<visitId>/complete           (doctor01)
12. POST   /doctors/me/checkout                 (doctor01)
13. POST   /auth/login                          (pharmacy01)
14. GET    /prescriptions/pending               (pharmacy01)
15. PUT    /prescriptions/<prescriptionId>/dispense (pharmacy01)
16. POST   /auth/login                          (lab01)
17. GET    /lab-requests/pending                (lab01)
18. POST   /lab-requests/<labRequestId>/report  (lab01)
```

---

## 11. Expected HTTP Status Codes

| Scenario | Status |
|----------|--------|
| Successful fetch | `200` |
| Successful creation | `201` |
| Missing/invalid fields | `400` |
| No token / bad token | `401` |
| Wrong role for endpoint | `403` |
| Record not found | `404` |
| Already exists (e.g. duplicate prescription) | `409` |

---

## 12. Common Mistakes

| Problem | Fix |
|---------|-----|
| `401 Unauthorized request` | Missing `Authorization: Bearer <token>` header |
| `403 Access denied` | Logged in as wrong role for that endpoint |
| `404 Doctor profile not found` | User exists in User table but no matching Doctor row |
| `404 Patient not found` | Passing User `id` instead of Patient profile `id` |
| `400 Already checked in` | Call `/doctors/me/checkout` first |
| `409 Prescription already exists` | One prescription per visit — can't create twice |
| `400 Visit is not in WAITING state` | Can only claim a WAITING visit |
| Login works but `LDAP_URL` 501 error | You set `LDAP_URL` in `.env` — remove it for dev |

---

## 13. Updating This File

When a new module/route is added:
1. Add a new numbered section under the relevant sprint heading
2. Include: method, path, required login role, request body, and a note on what to save from the response
3. Add the happy-path step to section 10
4. Add any new common mistakes to section 12
