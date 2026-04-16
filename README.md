# PHC Integrated Digital System

A web-based healthcare management platform for the Primary Health Centre at IIT Jodhpur. Digitizes patient records, clinical workflows, prescriptions, lab reports, pharmacy billing, and administrative operations across all PHC staff roles.

**Stack:** Node.js + Express · PostgreSQL (Prisma Cloud) · React · JWT auth · IITJ LDAP

> See [TESTING.md](TESTING.md) for setup and testing instructions.
<!-- > See [SRS 2.0](/docs/SRS%202.0.pdf) for the full requirements specification. -->

---

# Sprint Progress

> **Sprint Plan Period:** Jan 15, 2026 – Apr 30, 2026 | **Current Date:** Apr 17, 2026 (Sprint 7)
>
> Tracks all deliverables sprint by sprint. Tick = implemented and committed.

---

## Sprint 0 — Project Initiation & SRS Drafting
**Dates:** Jan 15 – Jan 24, 2026 | **Weeks:** 1–2 | **Status: Complete**

- [x] Initial requirements gathering and system scope definition
- [x] SRS v1.0 draft (core features: patient records, prescriptions, lab, pharmacy, billing)
- [x] SRS v1.1 (standardized REQ-XX identifiers, IEEE 830 structure)
- [x] Initial UML diagrams (use case, class, activity, sequence, component)

---

## Sprint 1 — Architecture Foundation
**Dates:** Jan 25 – Feb 7, 2026 | **Weeks:** 3–4 | **Status: Complete**

### Auth & Infrastructure
- [x] LDAP auth design with JWT session management (REQ-1 through REQ-8)
  - `POST /api/v1/auth/login` — accepts ldapId/password, issues JWT
  - `GET /api/v1/auth/me` — returns current user with profile
  - Local LDAP-backed bind flow wired through Docker Compose dev infrastructure
- [x] `verifyJWT` middleware — protects all non-public routes
- [x] `authorizeRoles(...roles)` middleware — RBAC enforcement per endpoint
- [x] Global error handler middleware — normalizes all errors to `ApiError` shape
- [x] `ApiError`, `ApiResponse`, `asyncHandler` utility classes
- [x] Constants (`UserRole`, `HTTP_STATUS`, `VisitStatus`)
- [x] Config module (JWT secret/expiry, LDAP URL, NODE_ENV)

### Database Schema
- [x] Full Prisma schema aligned with SRS 2.0
  - UserRole enum: `PATIENT`, `DOCTOR`, `RECEPTION_STAFF`, `PHARMACY_STAFF`, `LAB_STAFF`, `ADMIN`
  - VisitStatus enum: `WAITING`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED`
  - Profile models: `Patient`, `Doctor`, `ReceptionStaff`, `PharmacyStaff`, `LabStaff`
  - Clinical models: `Visit`, `VisitVitals`, `Appointment`, `Prescription`, `PrescriptionItem`
  - Lab models: `LabRequest`, `LabReport` (with `uploadedByLabStaffId` audit trail)
  - Other models: `ExternalDocument`, `Medicine`, `Bill`, `BillItem`, `DoctorAttendance`, `PHCEvent`
- [x] Prisma client generated (`backend/generated/prisma/`)

### Patient Profile
- [x] `GET /api/v1/patients/me` — patient views own profile (REQ-12)
- [x] `PUT /api/v1/patients/me` — patient updates profile fields
- [x] `GET /api/v1/patients/qr/:qrCode` — reception identifies patient by QR (REQ-15)
- [x] `GET /api/v1/patients/:id` — doctor/admin/reception views patient record (REQ-11)
- [x] `GET /api/v1/patients/:id/visits` — full visit history (REQ-10)

### Pending / Not Started
- [ ] Run `prisma migrate dev` against a live database (waiting for DB provisioning)
- [ ] Admin endpoint to create/manage user accounts (REQ-49) — moved to Sprint 5
- [ ] `POST /api/v1/auth/logout` — token invalidation / blacklisting

---

## Sprint 2 — Core Clinical Workflow
**Dates:** Feb 8 – Feb 21, 2026 | **Weeks:** 5–6 | **Status: Complete**

### Visit Lifecycle
- [x] `POST /api/v1/visits` — reception creates visit with optional vitals (REQ-17, REQ-28)
- [x] `GET /api/v1/visits/:id` — full visit record with all nested data
- [x] `POST /api/v1/visits/:id/vitals` — reception records weight/temp/BP at check-in (REQ-16)
- [x] `PUT /api/v1/visits/:id/claim` — doctor claims visit, prevents concurrent access (REQ-22)
- [x] `PUT /api/v1/visits/:id/consultation` — doctor saves clinical notes (REQ-24)
- [x] `PUT /api/v1/visits/:id/complete` — doctor marks visit as completed
- [x] `PUT /api/v1/visits/:id/cancel` — cancel a visit (reception/admin/doctor)
- [x] `GET /api/v1/visits/my-queue` — doctor views their waiting patient queue (REQ-21)

### Doctor Availability & Attendance
- [x] `GET /api/v1/doctors` — list available doctors (REQ-43)
- [x] `GET /api/v1/doctors/:id` — doctor profile
- [x] `PUT /api/v1/doctors/me/availability` — doctor sets availability status (REQ-20)
- [x] `POST /api/v1/doctors/me/checkin` — marks available, opens attendance record (REQ-35, REQ-36)
- [x] `POST /api/v1/doctors/me/checkout` — marks unavailable, computes total hours (REQ-37, REQ-38)
- [x] `GET /api/v1/doctors/attendance/records` — admin views attendance (REQ-50)

### Pending / Not Started
- [x] Doctor unavailability notification broadcast (REQ-34, REQ-41)
  - Specialists notify affected patients; physician absence form broadcasts in-app notifications

---

## Sprint 3 — Diagnostics & Prescription
**Dates:** Feb 22 – Mar 7, 2026 | **Weeks:** 7–8 | **Status: Complete**

### Prescription Module
- [x] `POST /api/v1/visits/:visitId/prescription` — doctor creates digital prescription (REQ-44, REQ-48)
- [x] `GET /api/v1/visits/:visitId/prescription` — doctor/pharmacy/patient views prescription (REQ-45, REQ-46)
- [x] `GET /api/v1/prescriptions/pending` — pharmacy views undispensed prescription queue
- [x] `PUT /api/v1/prescriptions/:id/dispense` — pharmacy marks prescription as dispensed (REQ-46)

### Lab Module
- [x] `POST /api/v1/visits/:visitId/lab-requests` — doctor requests a lab test (REQ-26)
- [x] `GET /api/v1/visits/:visitId/lab-requests` — view all lab requests for a visit (REQ-55, REQ-56)
- [x] `GET /api/v1/lab-requests/:id` — doctor/patient/lab/admin views a single lab request/report during consultation or follow-up (REQ-56, REQ-57)
- [x] `GET /api/v1/lab-requests/pending` — lab staff views outstanding test orders (REQ-54)
- [x] `POST /api/v1/lab-requests/:id/report` — lab staff uploads report with audit trail (REQ-54, REQ-55)

### Follow-up Delivered Later
- [x] `GET /api/v1/patients/me/lab-reports` — patient views their own lab reports (REQ-57)

---

## Sprint 4 — Operational Modules
**Dates:** Mar 8 – Mar 18, 2026 | **Weeks:** 9–10 | **Status: Complete**

### Medicine Inventory
- [x] `GET /api/v1/medicines` — view medicine inventory (REQ-66)
- [x] `GET /api/v1/medicines/:id` — get single medicine
- [x] `POST /api/v1/medicines` — admin adds medicine to inventory
- [x] `PUT /api/v1/medicines/:id/stock` — pharmacy updates stock quantity

### Pharmacy & Billing
- [x] `POST /api/v1/visits/:visitId/bill` — pharmacy generates medicine bill; atomically deducts stock (REQ-64, REQ-66)
- [x] `GET /api/v1/visits/:visitId/bill` — view bill with line items (REQ-65)
- [x] `GET /api/v1/bills/unpaid` — pharmacy queue of all unpaid bills
- [x] `PUT /api/v1/bills/:billId/pay` — mark bill as PAID

### Appointment Booking (Specialist slots)
- [x] `GET /api/v1/doctors/:id/appointments` — list doctor's appointments (REQ-30)
- [x] `POST /api/v1/appointments` — patient or reception books appointment (REQ-30, REQ-31)
- [x] `GET /api/v1/appointments/my` — patient views own appointments
- [x] `GET /api/v1/doctors/me/appointments` — doctor views own schedule
- [x] `PUT /api/v1/appointments/:id/cancel` — cancel appointment (REQ-33)
- [x] Block booking when doctor unavailable unless `isEmergency: true` (REQ-32, REQ-33)

### QR Check-In Flow
- [x] `POST /api/v1/checkin` — QR scan → resolve patient → create visit + vitals atomically (REQ-14 through REQ-18)

### External Document Digitization
- [x] `POST /api/v1/patients/:id/documents` — upload external medical document (REQ-59, REQ-60)
- [x] `GET /api/v1/patients/:id/documents` — list patient's external documents (REQ-63)
- [x] Document type tagging: `PRESCRIPTION` | `LAB_REPORT` | `DISCHARGE` (REQ-61, REQ-62)

---

## Sprint 5 — System Integration
**Dates:** Mar 19 – Apr 1, 2026 | **Weeks:** 11–12 | **Status: Complete**

### Admin User Management
- [x] `POST /api/v1/admin/users` — admin creates user account with role (REQ-49)
- [x] `GET /api/v1/admin/users` — list all users with filters
- [x] `PUT /api/v1/admin/users/:id` — update user role or deactivate account (REQ-49)
- [x] Auto-deactivation when staff/student leaves institution (§5.3) — handled via `isActive` updates

### PHC Events
- [x] `POST /api/v1/admin/events` — admin publishes PHC event/announcement (REQ-51)
- [x] `GET /api/v1/events` — public listing of upcoming PHC events

### System Reports
- [x] `GET /api/v1/admin/reports/usage` — generate system usage report (REQ-52)
- [x] `GET /api/v1/admin/reports/attendance` — attendance summary report

### Integration & Full Backend Build
- [x] End-to-end test of complete visit → consultation → prescription → lab → bill flow
  - `npm run test:e2e` boots the backend in-process and verifies the complete HTTP flow
- [x] API documentation (route index or Swagger/Postman collection)
  - Route index added in `backend/API_DOCUMENTATION.md`
- [x] Database migration deploy step verified against the configured cloud database
  - `npm run migrate:deploy`
- [x] `.env` secrets audit — remove any committed credentials
  - Verified that only `.env.example` files are tracked; local `.env` files remain untracked

---

## Sprint 6 — Frontend & UX Integration
**Dates:** Apr 2 – Apr 15, 2026 | **Weeks:** 13–14 | **Status: Complete**

### Role-Based Dashboards
- [x] Patient dashboard — medical records, prescriptions, lab reports, appointment booking, billing, profile with QR (REQ-10, 12, 30, 45, 57, 63, 65)
- [x] Doctor dashboard — visit queue, consultation form, prescription writer, lab request
- [x] Reception dashboard — QR scanner, visit creation form, vitals entry
- [x] Pharmacy dashboard — prescription queue, billing and dispense workflow, inventory view
- [x] Lab dashboard — pending test orders, report upload
- [x] Admin dashboard — user management, attendance, events, reports

### Auth & Routing
- [x] Login screen with ldapId/password (LDAP flow)
- [x] JWT storage and axios interceptor for Bearer token
- [x] Role-based route guards (redirect unauthorized users)
- [x] Logout and session expiry handling
- [x] Global Notification Center (REQ-34, 41)

---

## Sprint 7 — Testing & Stabilization
**Dates:** Apr 16 – Apr 20, 2026 | **Weeks:** 15–16 | **Status: In Progress**

- [ ] Unit tests for all service functions (happy path + error cases)
- [ ] Integration tests for all API routes
- [ ] RBAC tests — verify each role cannot access unauthorized endpoints
- [ ] Security hardening (rate limiting, input sanitization, HTTPS enforcement)
- [ ] Performance check under concurrent load
- [ ] Final database migration and seed script
- [ ] Deployment plan document
- [ ] Final system demo preparation

---

## API Route Summary

| Method | Route | Roles | REQ |
|--------|-------|-------|-----|
| POST | `/api/v1/auth/login` | Public | REQ-1,2 |
| GET | `/api/v1/auth/me` | All | — |
| GET | `/api/v1/patients/me` | PATIENT | REQ-12 |
| PUT | `/api/v1/patients/me` | PATIENT | — |
| GET | `/api/v1/patients/me/lab-reports` | PATIENT | REQ-57 |
| GET | `/api/v1/patients/qr/:qrCode` | RECEPTION_STAFF, ADMIN | REQ-15 |
| GET | `/api/v1/patients/:id` | DOCTOR, ADMIN, RECEPTION_STAFF | REQ-11 |
| GET | `/api/v1/patients/:id/visits` | DOCTOR, ADMIN, RECEPTION_STAFF, PATIENT | REQ-10 |
| GET | `/api/v1/doctors` | All | REQ-43 |
| GET | `/api/v1/doctors/:id` | All | — |
| PUT | `/api/v1/doctors/me/availability` | DOCTOR | REQ-20 |
| POST | `/api/v1/doctors/me/checkin` | DOCTOR | REQ-35,36 |
| POST | `/api/v1/doctors/me/checkout` | DOCTOR | REQ-37,38 |
| GET | `/api/v1/doctors/attendance/records` | ADMIN | REQ-50 |
| POST | `/api/v1/doctors/:id/absence` | RECEPTION_STAFF, ADMIN | REQ-40,41 |
| POST | `/api/v1/visits` | RECEPTION_STAFF, ADMIN | REQ-17,28 |
| GET | `/api/v1/visits/my-queue` | DOCTOR | REQ-21 |
| GET | `/api/v1/visits/:id` | DOCTOR, ADMIN, RECEPTION_STAFF, PHARMACY_STAFF, LAB_STAFF | — |
| POST | `/api/v1/visits/:id/vitals` | RECEPTION_STAFF, ADMIN | REQ-16 |
| PUT | `/api/v1/visits/:id/claim` | DOCTOR | REQ-22 |
| PUT | `/api/v1/visits/:id/consultation` | DOCTOR | REQ-24 |
| PUT | `/api/v1/visits/:id/complete` | DOCTOR | — |
| PUT | `/api/v1/visits/:id/cancel` | DOCTOR, RECEPTION_STAFF, ADMIN | — |
| POST | `/api/v1/visits/:visitId/prescription` | DOCTOR | REQ-44,48 |
| GET | `/api/v1/visits/:visitId/prescription` | DOCTOR, PHARMACY_STAFF, PATIENT, ADMIN | REQ-45,46 |
| GET | `/api/v1/prescriptions/pending` | PHARMACY_STAFF, ADMIN | — |
| PUT | `/api/v1/prescriptions/:id/dispense` | PHARMACY_STAFF | REQ-46 |
| POST | `/api/v1/visits/:visitId/lab-requests` | DOCTOR | REQ-26 |
| GET | `/api/v1/visits/:visitId/lab-requests` | DOCTOR, PATIENT, LAB_STAFF, ADMIN | REQ-55,56 |
| GET | `/api/v1/lab-requests/:id` | DOCTOR, PATIENT, LAB_STAFF, ADMIN | REQ-56,57 |
| GET | `/api/v1/lab-requests/pending` | LAB_STAFF, ADMIN | REQ-54 |
| POST | `/api/v1/lab-requests/:id/report` | LAB_STAFF | REQ-54,55 |
| GET | `/api/v1/medicines` | All auth | REQ-66 |
| GET | `/api/v1/medicines/:id` | All auth | — |
| POST | `/api/v1/medicines` | ADMIN | — |
| PUT | `/api/v1/medicines/:id/stock` | PHARMACY_STAFF, ADMIN | REQ-66 |
| POST | `/api/v1/visits/:visitId/bill` | PHARMACY_STAFF, ADMIN | REQ-64,66 |
| GET | `/api/v1/visits/:visitId/bill` | PHARMACY_STAFF, DOCTOR, PATIENT, ADMIN | REQ-65 |
| GET | `/api/v1/bills/mine` | PATIENT | REQ-65 |
| GET | `/api/v1/bills/unpaid` | PHARMACY_STAFF, ADMIN | — |
| PUT | `/api/v1/bills/:billId/pay` | PHARMACY_STAFF, ADMIN | — |
| GET | `/api/v1/doctors/:id/appointments` | All auth | REQ-30 |
| GET | `/api/v1/appointments` | RECEPTION_STAFF, ADMIN | REQ-30,31 |
| POST | `/api/v1/appointments` | PATIENT, RECEPTION_STAFF | REQ-30,31 |
| GET | `/api/v1/appointments/my` | PATIENT | — |
| GET | `/api/v1/doctors/me/appointments` | DOCTOR | — |
| PUT | `/api/v1/appointments/:id/cancel` | PATIENT, RECEPTION_STAFF, ADMIN | REQ-33 |
| POST | `/api/v1/checkin` | RECEPTION_STAFF | REQ-14–18 |
| POST | `/api/v1/patients/:id/documents` | DOCTOR, RECEPTION_STAFF, PATIENT, ADMIN | REQ-59,60 |
| GET | `/api/v1/patients/:id/documents` | DOCTOR, RECEPTION_STAFF, PATIENT, ADMIN | REQ-63 |
| DELETE | `/api/v1/patients/:id/documents/:docId` | DOCTOR, RECEPTION_STAFF, PATIENT, ADMIN | REQ-63 |
| POST | `/api/v1/admin/users` | ADMIN | REQ-49 |
| GET | `/api/v1/admin/users` | ADMIN | REQ-49 |
| PUT | `/api/v1/admin/users/:id` | ADMIN | REQ-49 |
| POST | `/api/v1/admin/events` | ADMIN | REQ-51 |
| GET | `/api/v1/events` | Public | REQ-51 |
| GET | `/api/v1/admin/reports/usage` | ADMIN | REQ-52 |
| GET | `/api/v1/admin/reports/attendance` | ADMIN | REQ-50,52 |
| GET | `/api/v1/notifications/mine` | All auth | REQ-34,41 |
| PUT | `/api/v1/notifications/:id/read` | All auth | REQ-34,41 |

---

## Local LDAP Dev Setup

From the repo root:

```bash
docker compose up -d ldap
cd backend
npm install
npm run seed
npm run dev
```

Seeded LDAP credentials for development:

| ldapId | Password |
|--------|----------|
| `doctor01` | `doctor01pass` |
| `reception01` | `reception01pass` |
| `patient01` | `patient01pass` |
| `pharmacy01` | `pharmacy01pass` |
| `lab01` | `lab01pass` |
| `admin01` | `admin01pass` |
