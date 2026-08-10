# SSRL ERP - Production Deployment Guide

## 1. Required Infrastructure
- **Node.js**: v20 or higher.
- **PostgreSQL**: v15 or higher.
- **Frontend Hosting**: Vercel, Netlify, or Nginx serving static assets.
- **CDN/Storage**: ImageKit account for vehicle document and POD uploads.

## 2. Environment Variables

### PUBLIC (Frontend)
- `VITE_API_URL`: The public-facing URL of the backend API (e.g., `https://api.ssrl.com/api/v1`).

### SERVER-ONLY / SECRETS (Backend)
These variables MUST NEVER be injected into the frontend build.
- `DATABASE_URL`: Production PostgreSQL connection string.
- `JWT_SECRET`: High-entropy cryptographic secret for signing authentication tokens.
- `IMAGEKIT_PUBLIC_KEY`: ImageKit public API identifier.
- `IMAGEKIT_PRIVATE_KEY`: ImageKit administrative private key (CRITICAL SECRET).
- `IMAGEKIT_URL_ENDPOINT`: ImageKit CDN endpoint URL.
- `PORT`: Binding port for the Express API.

## 3. Database Initialization
SSRL ERP uses Prisma. The database schema must be applied safely using Prisma's official migration tooling.

**Migration Lifecycle:**
1. **Development:** `npx prisma migrate dev` (generates new SQL migrations).
2. **CI Testing:** `npx prisma migrate deploy` (tests migration applying to an empty DB).
3. **Production Deployment:** `npx prisma migrate deploy` (applies safely).

**NEVER use `npx prisma db push` for production deployment.**

## 4. Backend Startup Command
1. `npm install`
2. `npm run build`
3. `NODE_ENV=production node dist/index.js`

## 5. Frontend Build Command
1. `npm install`
2. `npm run build`
(Serve the output of the `dist/` directory)

## 6. Security Configurations
- **CORS Configuration**: The backend MUST explicitly allow the frontend domain using the `cors` middleware. Wildcards (`*`) must be rejected.
- **ImageKit**: The frontend never receives the `IMAGEKIT_PRIVATE_KEY`. It negotiates a temporary upload signature with the backend.

## 7. Health Verification
Ensure the backend API exposes standard reachability before attempting login.
A standard `GET /api/v1/settings` call can act as a basic database-liveness check.

## 8. Backup & Recovery Requirements
**BLOCKER LEVEL**: SSRL ERP does not currently ship with automated database backup scripts. 
Operators **MUST** configure hourly or daily WAL (Write-Ahead Logging) archiving and snapshotting via their RDS/Postgres hosting provider. Failure to do so risks catastrophic financial data loss.

## 9. Rollback Considerations
Because Prisma migrations are not automatically reversible in every situation, a database backup MUST be captured immediately prior to deployment of any schema-altering backend updates.

A rollback strategy must distinguish between:
- **Application Rollback:** Reverting the Node.js/Vite bundle to an older version.
- **Migration Rollback:** Not natively supported by `migrate deploy` without custom down-migrations.
- **Database Restore:** Restoring the entire PostgreSQL instance from the pre-deployment snapshot (this is the safest method for catastrophic schema failure).
