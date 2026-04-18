# IIT Jodhpur PHC System

Integrated digital system for the IIT Jodhpur Primary Health Centre.

The repository currently contains:
- a Node.js + Express REST API in `backend/`
- a React + Vite frontend in `frontend/`
- Prisma schema, migrations, seed data, and smoke/E2E/RBAC/load checks
- a Bruno API collection in `backend/tests/iitj-phc-system/`

Authoritative repo status in this file reflects the codebase as checked on April 18, 2026.

## Current Status

- Backend API: implemented and testable locally
- Frontend: present in the repo and buildable locally
- Auth: JWT with LDAP support; when `LDAP_URL` is unset, dev mode accepts any password for an existing `ldapId`
- Testing assets: unit tests, end-to-end flow, RBAC smoke checks, load check, Bash smoke suite, Bruno collection
- CI workflow: `.github/workflows/api-tests.yml`

## Stack

- Backend: Node.js, Express 5, Prisma 7, PostgreSQL
- Frontend: React 19, Vite 7, React Router 7, Zustand, Tailwind CSS 4
- Auth: JWT + LDAP
- File uploads: Cloudinary

## Repository Layout

```text
iitj-phc-system/
├── backend/
│   ├── src/                     # Express app, routes, controllers, services
│   ├── prisma/                  # Prisma schema, migrations, seed
│   ├── scripts/                 # e2e, rbac, load scripts
│   ├── tests/iitj-phc-system/   # Bruno collection (YAML format)
│   ├── tests/unit/              # Node test runner unit suites
│   ├── API_DOCUMENTATION.md
│   └── smoke_test.sh
├── frontend/                    # React dashboards
├── TESTING.md                   # setup + testing guide
├── PROJECT_REPORT.md            # extended project report
└── AGENTS.md                    # local agent guidance
```

## Implemented API Surface

The backend currently exposes 63 application routes under `/api/v1`, grouped across:
- `auth`
- `patients`
- `doctors`
- `visits`
- `prescriptions`
- `lab-requests`
- `medicines`
- `bills`
- `appointments`
- `checkin`
- `documents`
- `admin`
- `events`
- `notifications`
- `healthcheck`

See [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) for the current route index.

## Local Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Minimum env values:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=change-me
CORS_ORIGIN=http://localhost:5173
```

Optional local LDAP:

```bash
docker compose up -d ldap
```

Database bootstrap:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Backend base URL: `http://localhost:8000/api/v1`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## Seeded Accounts

The seed script creates these users:

| ldapId | Role |
|---|---|
| `doctor01` | `DOCTOR` |
| `reception01` | `RECEPTION_STAFF` |
| `patient01` | `PATIENT` |
| `pharmacy01` | `PHARMACY_STAFF` |
| `lab01` | `LAB_STAFF` |
| `admin01` | `ADMIN` |

If `LDAP_URL` is unset, any password works for seeded `ldapId` values in dev mode.

## Test Commands

Run from `backend/` unless noted otherwise.

```bash
npm run test:unit
npm run test:rbac
npm run test:e2e
npm run test:load
bash smoke_test.sh
```

Important:
- `test:e2e` and the full smoke suite exercise Cloudinary-backed upload paths and need valid Cloudinary env vars
- `test:load` expects a running backend server
- `test:rbac` boots the app in-process and only needs a working database

See [TESTING.md](TESTING.md) for prerequisites, sequencing, Bruno usage, and troubleshooting.

## Technology Readiness Level

Current assessment: **TRL 4**

This project has cleared TRL 1 through TRL 4 based on the repository contents and the implemented verification assets.

### TRL 1 — Basic principles observed

Cleared because the repository defines the core PHC digital workflow domains and technical foundations:
- role-based healthcare workflows are modeled across patients, visits, prescriptions, lab, billing, appointments, documents, admin, events, and notifications
- the backend stack and frontend stack are concretely selected and implemented in [backend/package.json](backend/package.json) and [frontend/package.json](frontend/package.json)
- the core data model is formalized in `backend/prisma/schema.prisma`

### TRL 2 — Technology concept formulated

Cleared because the system concept is no longer abstract:
- the repository separates the product into backend API, frontend dashboards, database schema, and test assets
- the backend architecture is implemented as routes -> controllers -> services -> Prisma
- local infrastructure for realistic authentication and uploads exists through Docker LDAP support, JWT auth, and Cloudinary-backed upload code

### TRL 3 — Experimental proof of concept

Cleared because the project includes executable proof-of-concept implementations:
- the Express app is assembled in `backend/src/app.js`
- database access, auth, billing, lab, appointment, and visit flows are implemented in `backend/src/services/`
- the React application exists in `frontend/src/` with routed role-oriented UI code rather than only mockups or design notes

### TRL 4 — Technology validated in the lab

Cleared because the integrated code is validated at component and subsystem level:
- Prisma schema, migrations, and seed data provide a reproducible database-backed environment
- service-level automated tests exist in `backend/tests/unit/`
- local development execution is supported through `npm run dev`, `npm run seed`, and Prisma migration commands

### Why the project is not claimed above TRL 4

This README does not claim TRL 5 or higher because the repository does not by itself demonstrate:
- validation in the actual IIT Jodhpur PHC or another real relevant deployment environment
- field validation with real doctors, reception staff, pharmacy staff, lab staff, administrators, or patients
- formal stress, resilience, or production-readiness qualification beyond development-level verification
- operational deployment, monitoring, support, and acceptance evidence

## Notes

- `backend/generated/prisma/` is generated code and should not be edited manually.
- The Bruno collection in `backend/tests/iitj-phc-system/` is YAML-based, not `.bru`.
- `PROJECT_REPORT.md` contains broader project/reporting material; use this README, `TESTING.md`, and `backend/API_DOCUMENTATION.md` as the current implementation references.
