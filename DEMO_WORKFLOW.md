# Demo Workflow

Structured 15–20 minute walkthrough for demonstrating the IIT Jodhpur PHC System end to end across all implemented roles and dashboards.

This workflow is designed for a live demo with:
- backend running
- frontend running
- seeded users present
- Cloudinary configured for uploads

## Demo Goal

Show that the project is an integrated PHC system, not a collection of isolated pages:
- role-based login and routing
- reception-led patient intake
- doctor consultation workflow
- pharmacy billing and dispensing
- lab report upload
- patient self-service visibility
- admin oversight and control

## Demo Prep

Before the audience joins:

1. Start the backend and frontend.
2. Run `npm run seed` from `backend/`.
3. Keep one sample PDF ready for:
   - lab report upload
   - patient document vault upload
4. Make sure Cloudinary env vars are valid.
5. Ensure `doctor01` is checked out before beginning.

Suggested startup commands:

```bash
cd backend
npm run seed
npm run dev
```

```bash
cd frontend
npm run dev
```

## Demo Accounts

Use these seeded users:

| Role | Account |
|---|---|
| Patient | `patient01` |
| Doctor | `doctor01` |
| Reception | `reception01` |
| Pharmacy | `pharmacy01` |
| Lab | `lab01` |
| Admin | `admin01` |

If `LDAP_URL` is unset, any password works in dev mode.

## Recommended Demo Structure

Total target: **15–20 minutes**

1. Opening and architecture framing: 1–2 min
2. Reception dashboard: 3 min
3. Doctor dashboard: 3–4 min
4. Pharmacy dashboard: 2–3 min
5. Lab dashboard: 2 min
6. Patient dashboard: 3–4 min
7. Admin dashboard and close: 2–3 min

## 1. Opening: What The System Is

Time: 1–2 minutes

Show:
- login page
- explain that the same platform serves six roles
- mention backend + frontend + PostgreSQL + Prisma + JWT + LDAP-style auth

Talking points:
- The system digitizes the PHC workflow from intake to consultation, prescription, lab, billing, patient visibility, and admin reporting.
- The app uses role-based routing, so each user lands in a different dashboard with different permissions.

## 2. Role-Based Login And Guards

Time: 1 minute

Log in once as one role, then log out and mention:
- each role is redirected automatically to its own dashboard
- unauthorized routes are guarded

If useful, briefly show:
- `/doctor/*`
- `/patient/*`
- `/reception-staff/*`
- `/pharmacy-staff/*`
- `/lab-staff/*`
- `/admin/*`

## 3. Reception Workflow

Time: 3 minutes

Login as `reception01`.

### Step 1: Patient lookup

Open:
- `/reception-staff/patients`

Show:
- QR-based patient lookup using `QR001`
- patient profile snapshot
- visit history table

Talking points:
- Reception can identify the patient quickly without paper records.
- Prior visit visibility helps before creating a new encounter.

### Step 2: Patient check-in

Open:
- `/reception-staff/checkin`

Show:
- identify patient by QR or ID
- optional doctor assignment or auto-assignment
- vitals entry
- create visit

Recommended action:
- use `QR001`
- keep visit type as `OPD`
- enter vitals
- create the visit

Call out:
- the visit is now in the doctor workflow
- this is the intake point for the whole chain

### Step 3: Reception overview

Open:
- `/reception-staff`

Show:
- live queue / operational status
- this confirms intake affected downstream state

## 4. Doctor Workflow

Time: 3–4 minutes

Login as `doctor01`.

### Step 1: Doctor overview/profile

Open:
- `/doctor`
- optionally `/doctor/profile`

Show:
- separate attendance and consultation availability
- check-in / check-out controls
- open / pause consultations

Recommended sequence:
1. Check in if needed
2. Open consultations if needed

Talking points:
- Attendance is not the same as availability.
- This models real PHC operational control more accurately.

### Step 2: Queue

Open:
- `/doctor/queue`

Show:
- the newly created waiting patient
- claim action

Action:
- claim the reception-created visit

### Step 3: Consultation

Open the consultation page after claiming.

Show:
- consultation notes
- prescription builder
- lab request entry

Recommended actions:
1. enter consultation notes
2. add one medicine
3. add one lab request
4. complete the visit

Talking points:
- This demonstrates structured digital consultation instead of handwritten workflow.
- The visit now feeds both pharmacy and lab modules.

## 5. Pharmacy Workflow

Time: 2–3 minutes

Login as `pharmacy01`.

Open:
- `/pharmacy-staff`

Show:
- pending prescriptions
- unpaid bill queue
- ready-to-dispense logic

Recommended sequence:
1. generate bill for the doctor-created prescription
2. mark the bill as paid
3. dispense the prescription

Talking points:
- The system enforces the correct operational order.
- Billing, payment, and dispensing are separate states.
- Medicine stock is updated as part of the billing flow.

Optional:
- open `/pharmacy-staff/inventory`
- show current medicine inventory and stock updates

## 6. Lab Workflow

Time: 2 minutes

Login as `lab01`.

Open:
- `/lab-staff`

Show:
- pending lab requests
- upload report modal

Action:
- upload a sample PDF for the request created by the doctor

Talking points:
- This is not just metadata entry; it supports actual report file upload.
- The uploaded report becomes patient-visible later in the flow.

## 7. Patient Workflow

Time: 3–4 minutes

Login as `patient01`.

Recommended dashboard path:
- `/patient`
- `/patient/lab-reports`
- `/patient/billing`
- `/patient/appointments`
- `/patient/vault`

### Step 1: Patient home / overview

Show:
- current PHC status or recent workflow visibility
- role-appropriate self-service dashboard

### Step 2: Lab reports

Open:
- `/patient/lab-reports`

Show:
- the uploaded lab report is visible to the patient

### Step 3: Billing

Open:
- `/patient/billing`

Show:
- generated bill and payment state

### Step 4: Appointments

Open:
- `/patient/appointments`
- optionally `/patient/appointments/book`

Show:
- booked/cancelled appointment visibility
- specialist booking capability

### Step 5: Document vault

Open:
- `/patient/vault`

Action:
- upload a sample PDF
- then delete it

Talking points:
- This demonstrates patient-side document management.
- The patient role is not read-only; it includes meaningful self-service capability.

## 8. Admin Workflow

Time: 2–3 minutes

Login as `admin01`.

Recommended path:
- `/admin`
- `/admin/users`
- `/admin/events`

### Step 1: Overview

Show:
- top-level usage summary
- attendance summary
- role/user counts

### Step 2: User management

Open:
- `/admin/users`

Show:
- list of users
- create user form
- activation/deactivation capability

Recommended action:
- create a sample user if you want a live mutation
- or show an already created one and toggle active state

### Step 3: Events

Open:
- `/admin/events`

Show:
- publish PHC event
- explain that public event listing is exposed through the backend

Talking points:
- Admin handles governance and operational oversight, not only configuration.

## Suggested Closing Statement

Time: 30–60 seconds

Use a close like:

This demo showed one complete PHC workflow moving across six roles: reception intake, doctor consultation, pharmacy billing and dispensing, lab upload, patient self-service access, and admin oversight. The key point is that every stage updates the same integrated system rather than separate spreadsheets, paper files, or disconnected tools.

## Fast Recovery During Demo

If something goes wrong:

- If `doctor01` is already checked in, call checkout once or use the doctor profile page.
- If queue state is messy, create a fresh visit from reception.
- If lab upload fails, verify Cloudinary env vars and restart backend.
- If login starts failing after repeated attempts, restart the backend to clear the in-memory auth limiter.
- If medicine billing fails on a rerun, reset stock from the pharmacy inventory page.

## Optional 2-Minute Technical Appendix

If the audience asks for implementation depth, show:
- `backend/src/app.js` for route mounting
- `backend/prisma/schema.prisma` for data model coverage
- `backend/scripts/e2e-full-flow.js` and `backend/smoke_test.sh` for verification evidence
- `frontend/src/features/` to show real role-specific frontend modules
