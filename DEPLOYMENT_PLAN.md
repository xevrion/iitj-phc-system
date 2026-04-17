# Deployment Plan

## Objective

Deploy the IITJ PHC System as a small production stack with:
- React frontend
- Node/Express backend
- PostgreSQL database
- Cloudinary for document and lab-report storage
- HTTPS terminated at a reverse proxy

## Target Topology

1. `frontend`
   - Static build served by Nginx or any static host
   - Talks only to the backend API origin

2. `backend`
   - Node.js process running `backend/src/server.js`
   - Environment-based config only
   - Behind reverse proxy

3. `database`
   - Managed PostgreSQL / Prisma Postgres
   - Backups enabled

4. `storage`
   - Cloudinary
   - Used for patient vault uploads and lab reports

## Required Environment Variables

### Backend

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRY`
- `CORS_ORIGIN`
- `PORT`
- `NODE_ENV=production`
- `ENFORCE_HTTPS=true`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX_REQUESTS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

### Frontend

- API base URL via the frontend environment/config already used by the app build

## Pre-Deployment Checklist

1. Apply pending Prisma migrations.
2. Run seed only if the target environment needs demo/test users.
3. Verify Cloudinary credentials.
4. Set strong production `JWT_SECRET`.
5. Set `CORS_ORIGIN` to the deployed frontend origin.
6. Enable HTTPS at the proxy/load balancer.
7. Set `ENFORCE_HTTPS=true`.
8. Run:
   - `npm run test:e2e`
   - `npm run test:rbac`
   - `npm run test:load`

## Deployment Steps

### Backend

```bash
cd backend
npm install
npx prisma migrate deploy
npm run start
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

Serve `frontend/dist/` using Nginx or another static host.

## Reverse Proxy Requirements

- Force HTTPS
- Forward `X-Forwarded-Proto=https`
- Forward client IP headers
- Route `/api/*` to backend
- Route all other frontend paths to `index.html`

## Post-Deployment Validation

1. `GET /api/v1/healthcheck`
2. Login as each seeded role in a staging/demo environment
3. Verify:
   - patient document upload
   - lab report upload
   - doctor queue
   - reception live queue
   - pharmacy billing flow

## Rollback Strategy

1. Keep previous backend build available.
2. Do not delete previous frontend build until smoke validation passes.
3. If a migration is destructive, require explicit DB backup before deployment.
4. If runtime issues appear:
   - roll backend back first
   - restore previous frontend build if needed
   - investigate logs before reattempting deployment
