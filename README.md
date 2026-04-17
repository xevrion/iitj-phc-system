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

## Notes

- `backend/generated/prisma/` is generated code and should not be edited manually.
- The Bruno collection in `backend/tests/iitj-phc-system/` is YAML-based, not `.bru`.
- `PROJECT_REPORT.md` contains broader project/reporting material; use this README, `TESTING.md`, and `backend/API_DOCUMENTATION.md` as the current implementation references.
