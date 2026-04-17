# PHC System Testing Guide

Testing and setup reference for the current repository state on April 18, 2026.

This guide covers:
- backend setup
- optional LDAP and frontend setup
- automated test commands
- Bruno collection usage
- upload-related prerequisites

## 1. Prerequisites

- Node.js `20+`
- npm
- PostgreSQL
- optional Docker and Docker Compose for local LDAP
- optional Cloudinary credentials for upload-backed routes and tests

Useful extras:
- Bruno
- Prisma Studio

## 2. Services and Ports

- frontend: `http://localhost:5173`
- backend API: `http://localhost:8000/api/v1`
- backend healthcheck: `http://localhost:8000/api/v1/healthcheck`
- local LDAP container: `ldap://127.0.0.1:1389`

## 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Minimum `.env` values:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=change-this
CORS_ORIGIN=http://localhost:5173
```

Optional LDAP values:

```env
LDAP_URL=ldap://127.0.0.1:1389
LDAP_BASE_DN=dc=iitj,dc=ac,dc=in
LDAP_USERS_OU=ou=users
```

Optional Cloudinary values for upload-backed routes:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=iitj-phc-system/medical-documents
```

Initialize the database:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npm run seed
```

Start the backend:

```bash
cd backend
npm run dev
```

## 4. Optional LDAP Setup

If you want real LDAP-backed local login:

```bash
docker compose up -d ldap
```

If `LDAP_URL` is not set, the backend uses dev mode and accepts any password for an existing `ldapId`.

## 5. Optional Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## 6. Seeded Users

| ldapId | Role | Password in dev mode |
|---|---|---|
| `doctor01` | `DOCTOR` | any if `LDAP_URL` is unset |
| `reception01` | `RECEPTION_STAFF` | any if `LDAP_URL` is unset |
| `patient01` | `PATIENT` | any if `LDAP_URL` is unset |
| `pharmacy01` | `PHARMACY_STAFF` | any if `LDAP_URL` is unset |
| `lab01` | `LAB_STAFF` | any if `LDAP_URL` is unset |
| `admin01` | `ADMIN` | any if `LDAP_URL` is unset |

Seeded reference data:
- patient name: `Rahul Verma`
- patient QR code: `QR001`
- medicines: `Paracetamol 500mg`, `Amoxicillin 250mg`

## 7. Automated Test Matrix

Run these from `backend/`.

### `npm run test:unit`

- Runs the Node test runner against `backend/tests/unit/*.test.js`
- Requires: database access for the services being exercised
- Does not require a separately started server

### `npm run test:rbac`

- Boots the backend in-process
- Verifies role boundaries against real HTTP routes
- Requires: database access
- Does not require Cloudinary

### `npm run test:e2e`

- Boots the backend in-process
- Executes the main visit -> consultation -> prescription -> lab -> billing flow
- Requires: database access
- Requires: valid Cloudinary credentials because the flow uploads a lab report

### `npm run test:load`

- Hits a running backend server
- Uses repeated requests against `/healthcheck`, `/auth/me`, and `/events`
- Requires: backend already running at `LOAD_TEST_BASE_URL` or default `http://localhost:8000/api/v1`

Optional overrides:

```bash
LOAD_TEST_BASE_URL=http://localhost:8000/api/v1 \
LOAD_TEST_CONCURRENCY=20 \
LOAD_TEST_ITERATIONS=5 \
npm run test:load
```

### `bash smoke_test.sh`

- Full Bash smoke suite
- Script header currently advertises 59 automated checks
- Requires: running backend server
- Requires: seeded DB
- Requires: valid Cloudinary credentials because the suite uploads a lab report

Default:

```bash
cd backend
bash smoke_test.sh
```

Custom base URL:

```bash
cd backend
bash smoke_test.sh http://localhost:8000/api/v1
```

## 8. Recommended Verification Order

For backend-only verification:

1. Configure `backend/.env`
2. Run `npx prisma migrate deploy`
3. Run `npm run seed`
4. Run `npm run test:unit`
5. Run `npm run test:rbac`

For full verification including uploads:

1. Configure Cloudinary env vars
2. Start the backend
3. Run `npm run test:e2e`
4. Run `bash smoke_test.sh`
5. Optionally run `npm run test:load`

## 9. Bruno Collection

Collection path:

```text
backend/tests/iitj-phc-system/
```

Open `backend/tests/iitj-phc-system/opencollection.yml` in Bruno.

### What the collection covers

The collection includes requests for:
- auth
- patients
- doctors
- visits
- prescriptions
- lab
- medicines
- billing
- appointments
- check-in
- documents
- admin
- events
- notifications

Recent collection additions in this update:
- reception live queue
- patient current visit
- doctor attendance self-view
- dispensed prescription history
- patient bill list
- staff appointment list
- document delete

### Token handling

Many request files use literal placeholders such as `ADMIN_TOKEN`, `DOCTOR_TOKEN`, or `{{token}}`.
Log in first and replace them with current values before replaying dependent requests.

### Common placeholders

| Placeholder | Meaning |
|---|---|
| `PATIENT_ID` | patient profile id |
| `PATIENT_PROFILE_ID` | patient profile id |
| `DOCTOR_ID` | doctor profile id |
| `DOCTOR_PROFILE_ID` | doctor profile id |
| `VISIT_ID` | visit id |
| `PRESCRIPTION_ID` | prescription id |
| `LAB_REQUEST_ID` | lab request id |
| `MEDICINE_ID` | medicine id |
| `BILL_ID` | bill id |
| `APPOINTMENT_ID` | appointment id |
| `USER_ID` | admin-managed user id |
| `DOC_ID` | external document id |
| `NOTIFICATION_ID` | notification id |

### Upload routes in Bruno

The implemented upload endpoints are:
- `POST /api/v1/lab-requests/:id/report`
- `POST /api/v1/patients/:id/documents`

The document service supports either:
- multipart upload with a `file` field
- JSON body with `fileUrl`

The lab report upload requires a real multipart file upload.

## 10. CI Workflow

The repo now includes `.github/workflows/api-tests.yml`.

Current behavior:
- always runs `test:unit` and `test:rbac` against a PostgreSQL service
- runs `test:e2e` only when Cloudinary secrets are available

That split is intentional because the upload-backed flow will fail without Cloudinary configuration.

## 11. Troubleshooting

### Backend not reachable

Start it:

```bash
cd backend
npm run dev
```

### Login fails unexpectedly

Check one of these:
- the user exists and `npm run seed` has been run
- `LDAP_URL` is unset for dev-mode auth
- or the local LDAP container is up and reachable

### Upload routes fail with Cloudinary errors

The upload helpers throw a `500` if these env vars are missing:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Doctor remains checked in between tests

Reset with:

```bash
curl -X POST \
  -H "Authorization: Bearer <DOCTOR_TOKEN>" \
  http://localhost:8000/api/v1/doctors/me/checkout
```

### Need a clean local DB

Apply migrations normally:

```bash
cd backend
npx prisma migrate deploy
```

Destructive local reset only if you explicitly want to wipe data:

```bash
cd backend
npx prisma migrate reset
```
