# PHC Integrated Digital System

A web-based healthcare management platform for the Primary Health Centre at IIT Jodhpur. Digitizes patient records, clinical workflows, prescriptions, lab reports, pharmacy billing, and administrative operations across all PHC staff roles.

**Stack:** Node.js + Express · PostgreSQL (Prisma Cloud) · React · JWT auth · IITJ LDAP

> See [TESTING.md](TESTING.md) for setup and testing instructions.
<!-- > See [SRS 2.0](/docs/SRS%202.0.pdf) for the full requirements specification. -->

---

# Sprint Progress

> **Sprint Plan Period:** Jan 15, 2026 – Apr 30, 2026 | **Current Date:** Feb 27, 2026 (Sprint 3)
>
> Tracks all deliverables sprint by sprint. Tick = implemented and committed.

---

## Sprint 0 — Project Initiation & SRS Drafting
**Dates:** Jan 15 – Jan 24, 2026 | **Status: Complete**

- [x] Initial requirements gathering and system scope definition
- [x] SRS v1.0 draft (core features: patient records, prescriptions, lab, pharmacy, billing)
- [x] SRS v1.1 (standardized REQ-XX identifiers, IEEE 830 structure)
- [x] Initial UML diagrams (use case, class, activity, sequence, component)

---

## Sprint 1 — Architecture Foundation
**Dates:** Jan 25 – Feb 7, 2026 | **Status: Complete**

### Auth & Infrastructure
- [x] LDAP auth design with JWT session management (REQ-1 through REQ-8)
  - `POST /api/v1/auth/login` — accepts ldapId/password, issues JWT
  - `GET /api/v1/auth/me` — returns current user with profile
  - LDAP bind stubbed; activates when `LDAP_URL` env is set (TBD-7)
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
**Dates:** Feb 8 – Feb 21, 2026 | **Status: Complete**

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
- [ ] `GET /api/v1/doctors/me/appointments` — specialist views booked appointment slots
- [ ] Appointment booking endpoints (REQ-30, REQ-31) — moved to Sprint 4
- [ ] Doctor unavailability notification broadcast (REQ-34, REQ-41) — needs notification service

---

## Sprint 3 — Diagnostics & Prescription
**Dates:** Feb 22 – Mar 7, 2026 | **Status: In Progress**

### Prescription Module
- [x] `POST /api/v1/visits/:visitId/prescription` — doctor creates digital prescription (REQ-44, REQ-48)
- [x] `GET /api/v1/visits/:visitId/prescription` — doctor/pharmacy/patient views prescription (REQ-45, REQ-46)
- [x] `GET /api/v1/prescriptions/pending` — pharmacy views undispensed prescription queue
- [x] `PUT /api/v1/prescriptions/:id/dispense` — pharmacy marks prescription as dispensed (REQ-46)

### Lab Module
- [x] `POST /api/v1/visits/:visitId/lab-requests` — doctor requests a lab test (REQ-26)
- [x] `GET /api/v1/visits/:visitId/lab-requests` — view all lab requests for a visit (REQ-55, REQ-56)
- [x] `GET /api/v1/lab-requests/pending` — lab staff views outstanding test orders (REQ-54)
- [x] `POST /api/v1/lab-requests/:id/report` — lab staff uploads report with audit trail (REQ-54, REQ-55)

### Pending / Not Started
- [ ] Patient views their own lab reports (REQ-57) — access control on existing endpoint covers this; needs patient-specific route
- [ ] Doctor views lab reports during consultation (REQ-56) — covered by visit fetch; explicit dedicated endpoint TBD
- [ ] Medicine inventory management endpoints (add/update stock) — needed before billing (Sprint 4)

---

## Sprint 4 — Operational Modules
**Dates:** Mar 8 – Mar 21, 2026 | **Status: Not Started**

### Pharmacy & Billing
- [ ] `GET /api/v1/medicines` — view medicine inventory (REQ-66)
- [ ] `POST /api/v1/medicines` — admin adds medicine to inventory
- [ ] `PUT /api/v1/medicines/:id/stock` — pharmacy updates stock quantity
- [ ] `POST /api/v1/visits/:visitId/bill` — pharmacy generates medicine bill (REQ-64)
- [ ] `GET /api/v1/visits/:visitId/bill` — view bill for a visit (REQ-65)
- [ ] Inventory deduction on bill generation (REQ-66)
- [ ] Low-stock notification trigger (REQ-66)

### Appointment Booking (Specialist slots)
- [ ] `GET /api/v1/doctors/:id/appointments` — view available slots (REQ-30)
- [ ] `POST /api/v1/doctors/:id/appointments` — patient books a slot (REQ-30, REQ-31)
- [ ] `DELETE /api/v1/appointments/:id` — cancel appointment (REQ-33)
- [ ] Block booking when specialist is unavailable (REQ-33)
- [ ] Emergency slot flag (`isEmergency`) handling (REQ-32)

### QR Check-In Flow
- [ ] `POST /api/v1/checkin` — full QR scan → fetch patient → auto-fill → create visit in one flow (REQ-14 through REQ-18)

### External Document Digitization
- [ ] `POST /api/v1/patients/:id/documents` — staff uploads external medical document (REQ-59, REQ-60)
- [ ] `GET /api/v1/patients/:id/documents` — list patient's external documents (REQ-63)
- [ ] Document category tagging (`PRESCRIPTION`, `LAB_REPORT`, `DISCHARGE`) (REQ-61, REQ-62)

---

## Sprint 5 — System Integration & Admin
**Dates:** Mar 22 – Apr 4, 2026 | **Status: Not Started**

### Admin User Management
- [ ] `POST /api/v1/admin/users` — admin creates user account with role (REQ-49)
- [ ] `GET /api/v1/admin/users` — list all users with filters
- [ ] `PUT /api/v1/admin/users/:id` — update user role or deactivate account (REQ-49)
- [ ] Auto-deactivation when staff/student leaves institution (§5.3)

### PHC Events
- [ ] `POST /api/v1/admin/events` — admin publishes PHC event/announcement (REQ-51)
- [ ] `GET /api/v1/events` — public listing of upcoming PHC events

### System Reports
- [ ] `GET /api/v1/admin/reports/usage` — generate system usage report (REQ-52)
- [ ] `GET /api/v1/admin/reports/attendance` — attendance summary report

### Integration & Full Backend Build
- [ ] End-to-end test of complete visit → consultation → prescription → lab → bill flow
- [ ] API documentation (route index or Swagger/Postman collection)
- [ ] Database migration run against staging DB
- [ ] `.env` secrets audit — remove any committed credentials

---

## Sprint 6 — Frontend & UX Integration
**Dates:** Apr 5 – Apr 18, 2026 | **Status: Not Started**

### Role-Based Dashboards
- [ ] Patient dashboard — medical records, prescriptions, lab reports, appointment booking
- [ ] Doctor dashboard — visit queue, consultation form, prescription writer, lab request
- [ ] Reception dashboard — QR scanner, visit creation form, vitals entry
- [ ] Pharmacy dashboard — prescription queue, dispense action, inventory view
- [ ] Lab dashboard — pending test orders, report upload
- [ ] Admin dashboard — user management, attendance, events, reports

### Auth & Routing
- [ ] Login screen with ldapId/password (LDAP flow)
- [ ] JWT storage and axios interceptor for Bearer token
- [ ] Role-based route guards (redirect unauthorized users)
- [ ] Logout and session expiry handling

---

## Sprint 7 — Testing & Stabilization
**Dates:** Apr 19 – Apr 30, 2026 | **Status: Not Started**

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
| GET | `/api/v1/patients/qr/:qrCode` | RECEPTION_STAFF, ADMIN | REQ-15 |
| GET | `/api/v1/patients/:id` | DOCTOR, ADMIN, RECEPTION_STAFF | REQ-11 |
| GET | `/api/v1/patients/:id/visits` | DOCTOR, ADMIN, RECEPTION_STAFF, PATIENT | REQ-10 |
| GET | `/api/v1/doctors` | All | REQ-43 |
| GET | `/api/v1/doctors/:id` | All | — |
| PUT | `/api/v1/doctors/me/availability` | DOCTOR | REQ-20 |
| POST | `/api/v1/doctors/me/checkin` | DOCTOR | REQ-35,36 |
| POST | `/api/v1/doctors/me/checkout` | DOCTOR | REQ-37,38 |
| GET | `/api/v1/doctors/attendance/records` | ADMIN | REQ-50 |
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
| GET | `/api/v1/lab-requests/pending` | LAB_STAFF, ADMIN | REQ-54 |
| POST | `/api/v1/lab-requests/:id/report` | LAB_STAFF | REQ-54,55 |
