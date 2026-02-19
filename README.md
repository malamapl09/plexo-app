# Plexo Operations

Multi-tenant SaaS platform for retail store operations management. Built with NestJS, Next.js, and Flutter.

**Business model:** Plexo sells directly to companies. Platform admins create client organizations, each with isolated data. Client admins invite their employees via email. No self-service signup.

## Project Structure

```
plexo-app/
├── apps/
│   ├── api/          # NestJS Backend API
│   ├── mobile/       # Flutter Mobile App (iOS + Android)
│   └── web/          # Next.js Web Dashboard
├── packages/
│   └── database/     # Prisma Schema + Migrations
├── scripts/          # Backup and deployment scripts
└── .github/
    └── workflows/    # CI/CD (GitHub Actions)
```

## Modules (15)

### Operations
1. **Tasks** — Daily task assignments HQ → stores with photo evidence and verification
2. **Receiving** — Delivery management with barcode scanning, discrepancy reporting, digital signatures
3. **Issues** — Ticket system with auto-assignment, escalation, and categorization
4. **Verification** — Supervisor verification queue for completed work

### Quality & Compliance
5. **Checklists / SOPs** — Recurring checklists (daily/weekly/monthly) with scoring
6. **Audits** — Store inspections with sections, weighted scoring, findings
7. **CAPA** — Auto-created corrective actions from audit findings, checklist failures (< 70%), high-priority issues
8. **Planograms** — Visual merchandising: HQ publishes references, stores submit photos, HQ approves
9. **Campaigns** — Promotional campaign execution with photo evidence and approval cycle

### Team & Development
10. **Training / LMS** — Courses with lessons, quizzes, enrollment tracking, certification
11. **Gamification** — Points, badges, leaderboards (individual/store/department) with per-capita scoring
12. **Communications** — HQ announcements with read receipts and acknowledgement tracking

### Administration
13. **Users** — User management with email invitations
14. **Stores** — Store and region configuration with tiers
15. **Module Permissions** — Granular role x module access control (configurable by super admin)

### Platform (SaaS)
- **Platform Admin** — Create/manage organizations, assign plans, view cross-org stats
- **Invitations** — Email-based user onboarding with token-based acceptance
- **Password Reset** — Forgot/reset password flow via email

## Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile | Flutter + Riverpod + Drift |
| Web | Next.js 14 + TailwindCSS |
| API | NestJS + TypeScript |
| Database | PostgreSQL 16 + Prisma |
| Cache | Redis |
| Storage | AWS S3 (prod) / MinIO (dev) |
| Email | Amazon SES (mock mode for dev) |
| Push | Firebase Cloud Messaging |
| Monitoring | Sentry |
| CI/CD | GitHub Actions → GHCR → EC2 |

## Multi-Tenancy

- `Organization` model with slug, domain, branding, timezone, plan
- `organizationId` on 32+ tenant-scoped models
- `prisma.forTenant(orgId)` auto-injects organization filter on all queries
- JWT payload includes `organizationId` — extracted via `@CurrentUser()` decorator
- Auth service is intentionally NOT tenant-scoped (cross-org email lookup)

## Prerequisites

- Node.js 20+
- Flutter 3.16+
- PostgreSQL 16
- Redis

## Quick Start (Local Development)

### Option A: Docker Compose (recommended)

```bash
# Copy env file and set passwords
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD, REDIS_PASSWORD, MINIO_ROOT_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET

# Start all services
docker compose -f docker-compose.dev.yml up -d

# Run seed (first time only)
docker compose -f docker-compose.dev.yml --profile seed up seed
```

### Option B: Native (macOS)

#### 1. Install Services

```bash
# PostgreSQL 16
brew install postgresql@16
brew services start postgresql@16

# Redis
brew install redis
brew services start redis

# MinIO (for file storage)
brew install minio/stable/minio
mkdir -p ~/minio-data
MINIO_ROOT_USER=plexo MINIO_ROOT_PASSWORD=plexo_minio_2024 minio server ~/minio-data --console-address :9001 &

# Create MinIO buckets
brew install minio/stable/mc
mc alias set local http://localhost:9000 plexo plexo_minio_2024
mc mb local/photos local/signatures local/documents --ignore-existing
mc anonymous set download local/photos local/signatures local/documents
```

#### 2. Configure Database

```bash
/opt/homebrew/opt/postgresql@16/bin/createuser -s plexo
/opt/homebrew/opt/postgresql@16/bin/psql -c "ALTER USER plexo WITH PASSWORD 'plexo_dev_2024';" postgres
/opt/homebrew/opt/postgresql@16/bin/createdb -O plexo plexo
```

#### 3. Install Dependencies

```bash
cd plexo-app

# Backend
cd apps/api && npm install

# Web
cd ../web && npm install

# Flutter
cd ../mobile && flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

#### 4. Run Migrations & Seed

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy

# Seed demo data
cd ../../packages/database
npx tsx prisma/seed.ts
```

#### 5. Start Applications

```bash
# Terminal 1 — API
cd apps/api && npm run start:dev

# Terminal 2 — Web
cd apps/web && npm run dev

# Terminal 3 — Mobile (iOS Simulator)
cd apps/mobile && open -a Simulator && flutter run
```

## Development URLs

| Service | URL |
|---------|-----|
| API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| Web Dashboard | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |

## Test Credentials (Seed Data)

Password for all: `demo1234`

| Role | Email | Notes |
|------|-------|-------|
| Platform Admin | platform@plexoapp.com | Cross-org management |
| Operations Manager | admin@demo.plexoapp.com | Demo org super admin |
| Store Manager | gerente.duarte@demo.plexoapp.com | Demo store |
| Dept Supervisor | supervisor.electro@demo.plexoapp.com | Demo department |

## Onboarding Flow

1. **Plexo platform admin** creates an Organization + first admin user via `/platform/organizations`
2. Admin user receives welcome email with temporary password
3. Admin logs in, invites employees via email
4. Employees receive invitation email, set name + password, start using the app

## API Overview

```
# Authentication (public)
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/profile

# Platform Admin (isPlatformAdmin only)
POST   /api/v1/platform/organizations
GET    /api/v1/platform/organizations
GET    /api/v1/platform/organizations/:id
PATCH  /api/v1/platform/organizations/:id
GET    /api/v1/platform/stats

# Invitations
POST   /api/v1/invitations          # Send invite (auth)
GET    /api/v1/invitations           # List pending (auth)
DELETE /api/v1/invitations/:id       # Revoke (auth)
POST   /api/v1/invitations/accept   # Accept invite (public)

# Module Access / Permissions
GET    /api/v1/module-access/my-modules
GET    /api/v1/module-access/grid
PATCH  /api/v1/module-access/:role

# Core Modules — see docs/API.md for full documentation
# Users, Stores, Tasks, Receiving, Issues, Verification
# Checklists, Audits, CAPA, Planograms, Campaigns
# Training, Gamification, Communications
```

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `JWT_SECRET` | JWT signing secret | (required, no default) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (required, no default) |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `STORAGE_MODE` | `minio` or `s3` | `minio` |
| `MINIO_ENDPOINT` | MinIO host (dev) | `localhost` |
| `MINIO_PORT` | MinIO port (dev) | `9000` |
| `MINIO_ACCESS_KEY` | MinIO user (dev) | `plexo` |
| `MINIO_SECRET_KEY` | MinIO password (dev) | (see .env) |
| `AWS_S3_BUCKET` | S3 bucket (prod) | `plexo-uploads` |
| `AWS_S3_REGION` | S3 region (prod) | `us-east-1` |
| `AWS_SES_FROM_EMAIL` | SES sender email | (optional) |
| `AWS_SES_REGION` | SES region | `us-east-1` |
| `APP_URL` | Frontend URL (for email links) | `http://localhost:3000` |
| `SENTRY_DSN` | Sentry error tracking | (optional) |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000` |
| `APP_NAME` | Application name | `Plexo` |

### Web (`apps/web/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_NAME` | App display name | `Plexo` |
| `NEXT_PUBLIC_APP_LOGO` | Logo path | `/logo.png` |

## Production Deployment

See `docker-compose.prod.yml` for the production setup. Infrastructure:

| Component | Service |
|-----------|---------|
| App server | EC2 t4g.small (Docker Compose) |
| Database | RDS PostgreSQL 16 |
| Cache | ElastiCache Redis |
| File storage | S3 |
| Email | Amazon SES |
| SSL | Let's Encrypt via Coolify |
| CI/CD | GitHub Actions → GHCR → EC2 |
| Monitoring | Sentry |
| Backups | Daily pg_dump → S3 (30-day retention) |

Deploy on push to `main`:
```bash
# Manual deploy
docker compose -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.prod.yml up -d
```

## Development Commands

```bash
# API
cd apps/api
npm run start:dev    # Dev with hot-reload
npm run lint         # Linting

# Web
cd apps/web
npm run dev          # Dev server
npm run build        # Production build

# Mobile
cd apps/mobile
flutter run          # Dev
flutter build apk    # Android
flutter build ios    # iOS

# Database
cd packages/database
npx prisma studio    # GUI explorer
npx prisma migrate dev --name description  # New migration
npx prisma generate  # Regenerate client
```

## Documentation

- [API Documentation](docs/API.md) — Endpoints, request/response formats, status flows
- [Web Dashboard](docs/WEB.md) — Next.js admin app, pages, navigation
- [Mobile App](docs/MOBILE.md) — Flutter app, features, offline support
- [Board Summary](docs/BOARD-SUMMARY.md) — Executive summary for stakeholders

---

Plexo Operations Platform &copy; 2026
