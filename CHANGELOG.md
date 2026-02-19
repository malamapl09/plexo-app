# Changelog

All notable changes to Plexo Operations.

## [Unreleased]

### Added — SaaS Infrastructure
- **Multi-tenancy** — `Organization` model, `organizationId` on 32 tables, `prisma.forTenant(orgId)` auto-filter via Prisma Client Extensions
- **Platform Admin module** — `POST/GET/PATCH /platform/organizations`, `GET /platform/stats`; `PlatformAdminGuard` checks `isPlatformAdmin`; organization onboarding creates org + 5 roles + 75 module access rows + admin user + 9 point configs in a single transaction
- **User Invitations** — `POST/GET/DELETE /invitations`, `POST /invitations/accept` (public); crypto token with 7-day expiry; invitation email via SES
- **Password Reset** — `POST /auth/forgot-password`, `POST /auth/reset-password` (public); crypto token with 1-hour expiry; reset email via SES
- **Email Service (Amazon SES)** — `EmailModule` with `sendWelcome()`, `sendPasswordReset()`, `sendInvitation()`; mock mode when SES not configured (logs `[MOCK]`); XSS-safe HTML templates with `escapeHtml()`
- **S3 Storage** — replaced MinIO client with `@aws-sdk/client-s3`; dual-mode: `STORAGE_MODE=s3` for production (IAM role), `STORAGE_MODE=minio` for local dev (S3-compatible endpoint)
- **Sentry Monitoring** — `@sentry/nestjs` initialized in `main.ts`, gated by `SENTRY_DSN` env var; Swagger docs disabled in production
- **CI/CD** — `.github/workflows/deploy.yml` (build → GHCR → SSH deploy to EC2 with migration step), `.github/workflows/test.yml` (lint + build on PRs)
- **Docker Compose split** — `docker-compose.dev.yml` (Postgres + Redis + MinIO + migrate + seed + API + Web), `docker-compose.prod.yml` (migrate + API + Web, connects to external RDS/ElastiCache/S3)
- **Backup script** — `scripts/backup.sh` daily pg_dump to S3 with 30-day retention, `.pgpass` for secure auth
- **Web platform admin pages** — `(platform)/organizations` list/create/detail, `(platform)/stats` dashboard
- **Web auth pages** — `forgot-password`, `reset-password`, `accept-invite` pages
- **Web invite user** — "Invitar Usuario" button on users page with role/store/department selector, pending invitations table
- **Mobile forgot password** — "Forgot password?" link on login page opens web URL
- **Prisma schema** — `Invitation` model, `resetToken`/`resetTokenExpiry` on User, `CAMPAIGN_SUBMITTED`/`PERFECT_DAY` gamification actions, `invitedBy` relation
- **JWT** — `isPlatformAdmin` included in payload; `JWT_SECRET` throws on missing (no hardcoded fallback)
- `.env.production.example` with RDS, ElastiCache, S3, SES, Sentry vars

### Added
- **Training / LMS module** — full-stack course management with enrollment and quiz system
  - API: 20 endpoints under `/training` — CRUD courses/lessons/questions, bulk enroll by user or role, enrollment lifecycle (start → complete lessons → submit quiz → complete course), dashboard stats, per-store compliance
  - Web: course list with category/status filters, course detail with enrollment + compliance tabs, course creation page
  - Mobile: training section in drawer nav, course list and detail screens
  - Prisma: `TrainingCourse`, `TrainingLesson`, `TrainingQuizQuestion`, `TrainingEnrollment`, `TrainingProgress` models with `TrainingCourseCategory`, `TrainingLessonType`, `TrainingQuizQuestionType`, `TrainingEnrollmentStatus`, `TrainingProgressStatus` enums
  - Gamification integration: course completion awards points via `TRAINING_COMPLETED` action
  - Seed: 10 courses (27 lessons, 59 quiz questions) based on actual Plexo procedure PDFs — covers Recepcion, Cuadre de Caja, Caja Chica, Devoluciones, Venta al por Mayor, Decomiso, Bonos Comerciales, Mercancia en Transito, Averias, Activos Fijos
  - `TRAINING` added to module permissions system
- **Campaign / Promotion Execution** — full campaign lifecycle: HQ creates campaigns with type, priority, dates, reference photos, materials list, and instructions; targets stores by ID or region; stores submit photo evidence; HQ approves or requests revision
- `Campaign` and `CampaignSubmission` models with `CampaignStatus`, `CampaignSubmissionStatus`, `CampaignType` enums
- Campaign API: 13 endpoints — CRUD, status transitions, submit/resubmit, review, compliance dashboard, my-pending
- Campaign scheduler: auto-completes expired campaigns (7 AM daily), deadline reminders at 1/3 days (9 AM daily)
- Gamification: `CAMPAIGN_EXECUTED` action type (15 points), 50% quality multiplier on resubmissions
- Web: campaign list with filters, create/edit modal, detail page with submissions, submission review with side-by-side photo comparison, compliance dashboard tab
- Mobile: campaigns feature with pending/submissions tabs, campaign detail, photo submission with reference photos, resubmit on revision
- `campaigns` module added to permissions system (enabled for all roles by default)
- **Gamification fairness overhaul** — store tiers, per-capita scoring, 3-tab leaderboards, quality multipliers, compliance scoring
- `StoreTier` enum (SMALL/MEDIUM/LARGE) with auto-calculation from employee count and admin override
- `StoreDepartment` join table — admin can toggle which departments are active per store
- `StorePoints` and `DepartmentPoints` models — aggregate points with per-capita normalization
- `GET /gamification/leaderboard/:type` — unified endpoint for individual, store, and department leaderboards with filters (period, role, tier, region, department)
- `GET /gamification/store/:storeId/compliance` — weekly and monthly compliance rates
- `PATCH /stores/:id/tier` — admin can set store tier with override flag
- `GET /stores/:id/departments` and `PATCH /stores/:id/departments` — manage active departments per store
- Quality multiplier: resubmissions after rejection earn 50% points (`isFirstAttempt` + `qualityMultiplier` on PointTransaction)
- Daily compliance scheduler (2 AM) — calculates task/checklist/audit completion rates per store
- Daily employee count sync (3 AM) — updates per-capita values and auto-adjusts store tiers
- Weekly/monthly resets now include StorePoints and DepartmentPoints
- Web: 3-tab leaderboard page (Individual/Tiendas/Departamentos) with period selector, role and tier filters, podium display, compliance progress bars
- Mobile: 3-tab leaderboard with TabBar, period chips, dynamic role/tier filter chips, store compliance bars, per-capita scoring display
- Streak badge logic now calculates actual consecutive-day streaks

### Fixed
- **Training N+1 queries** — `findAllCourses`, `getMyCourses`, `getCourseCompliance` use `groupBy`/batch queries instead of per-row loops
- **Training bulk enroll** — `bulkEnroll`/`enrollByRole` use `createMany` with `skipDuplicates` instead of loop
- **Training quiz validation** — rejects wrong answer count, duplicate answers, invalid question IDs; options require `@ArrayMinSize(2)`
- **Training enrollment guards** — `completeLesson`/`submitQuiz` reject COMPLETED or ASSIGNED enrollments (must be IN_PROGRESS)
- **Training quiz race condition** — attempt counter uses `{ increment: 1 }` instead of read-then-write
- **Training soft delete** — lessons and questions use `isActive: false` instead of hard delete; all queries filter `isActive: true`
- **Training schema indexes** — `@@index([courseId, status])` on enrollment, `@@index([isMandatory])` on course
- **Training web pages** — consistent category labels, fixed scope display (`ALL` not `ALL_STORES`), enrollment error feedback, compliance loading state
- **Training seed accuracy** — fixed Caja Chica max (RD$3,000 not RD$5,000), removed fabricated Cuadre de Caja rules, corrected Devoluciones timelines, added real SAP codes/thresholds from procedure PDFs
- **Mobile: audits/checklists crash** — `score`, `actualScore`, `maxPossibleScore`, `maxScore` parsed as `int` but API returns `Float`; all now use `(num?)?.toInt()`
- **API: planograms 400 on mobile** — `mine=true` query param rejected by `forbidNonWhitelisted`; added `mine` field to `PlanogramQueryDto` and filter logic in service
- **Mobile training: score crash** — `score` field parsed as `int` but API returns `Float`; now uses `(num?)?.toInt()`
- **Mobile training: totalLessons always 0** — enrollment list showed `0/0 lecciones` because API returns `_count.lessons` not `lessons[]`; added `_count` parsing and `apiTotalLessons` fallback
- **Mobile training: quiz results wrong** — read `result['correct']` but API returns `result['isCorrect']`; all answers showed as incorrect
- **Mobile training: quiz passed always false** — read nonexistent `_results['passed']` field; now derives from `score >= passingScore`
- **Mobile training: double AppBar** — removed inner `Scaffold` from `TrainingPage`; shell route already provides AppBar
- **Mobile training: pull-to-refresh broken** — loading/error states now use `ListView` so `RefreshIndicator` works
- **Mobile training: stale state after complete** — `completeCourse` now clears `currentEnrollment`
- **Mobile training: quiz retry** — added "Reintentar" button when quiz score below passing threshold
- **Mobile:** Missing planogram submit/detail routes caused crash when tapping planogram cards
- **API:** Planogram duplicate submissions — added `@@unique([templateId, storeId])` constraint + app-level check before create
- **Mobile:** CAPA list now parses nested `store`/`assignedTo` objects from API (was reading nonexistent flat fields)
- **API:** Planogram review DTO restricted to `APPROVED`/`NEEDS_REVISION` only (was accepting any status)
- **API:** Gamification compliance uses `assignedAt` for tasks and `scheduledDate` for audits (was using `createdAt`, miscounting across periods)
- **Web:** Campaigns table row click uses `router.push` instead of `window.location.href` (no more full page reloads)
- Per-capita race condition: increment + recalculation now wrapped in Prisma `$transaction`
- All-time store leaderboard no longer misleadingly shows monthly compliance (returns null instead)
- Compliance no longer inflated by `PENDING_VERIFICATION` tasks (only `COMPLETED`/`VERIFIED` count)
- Leaderboard type param now validated with `BadRequestException` for invalid values
- Mobile role filter chips now fetched dynamically from `GET /roles/active` instead of hardcoded

---

## [1.0.0] - 2026-02-11

### Changed
- **Dynamic roles** — roles are now DB-driven instead of a Prisma `UserRole` enum; add/edit/deactivate roles from admin UI without code changes
- Role hierarchy uses numeric `level` field (higher level can verify lower)
- Verification service uses DB role levels instead of hardcoded hierarchy map
- Module access grid and permissions page built from DB roles dynamically

### Added
- `Role` database table (`key`, `label`, `description`, `color`, `level`, `sortOrder`, `isActive`)
- Roles CRUD API: `GET /roles`, `GET /roles/active`, `POST /roles`, `PATCH /roles/:id`, `DELETE /roles/:id`
- Web: `/settings/roles` admin page — create, edit, deactivate roles with color picker and level assignment
- Web: users page and permissions page now fetch roles dynamically from API
- Mobile: `RolesProvider` fetches active roles for dynamic label/color rendering
- Shared `ALL_MODULES` constant (`apps/api/src/common/constants/modules.ts`)
- Role validation on user create and update (rejects invalid role keys)
- `docs/WEB.md` — web dashboard documentation
- Updated `README.md`, `docs/API.md`, `docs/MOBILE.md` to reflect current feature set

### Fixed
- `getRoleLevel()` now throws on invalid role instead of silently returning 0
- `requiresVerification()` handles empty roles array (returns false)
- Race condition in role creation — uniqueness enforced via DB constraint (P2002) instead of check-then-insert

## [0.9.0] - 2025-02-11

### Added
- **DB-configurable module permissions** — `RoleModuleAccess` table (5 roles x 13 modules) controls sidebar visibility and route access
- `isSuperAdmin` Boolean flag on User model — bypasses all module checks
- `GET /auth/profile` — returns user info with `moduleAccess` and `isSuperAdmin`
- Login and refresh responses now include `moduleAccess[]` and `isSuperAdmin`
- Module access API: `GET /module-access/my-modules`, `GET /module-access/grid`, `PATCH /module-access/:role`
- Web: `/settings/permissions` admin page — role x module toggle grid (super admin only)
- Web: sidebar filtered by `moduleAccess`, route protection redirects unauthorized paths
- Mobile: drawer filtered by `moduleAccess`, GoRouter redirect guards
- Seed: 65 default permission rows + admin user set as `isSuperAdmin`

## [0.8.0] - 2025-02-10

### Changed
- Mobile: replaced bottom navigation with side **drawer** in 3 sections (Operaciones, Calidad, Equipo)
- All 11 feature routes accessible from drawer
- `app_theme.dart` updated with `drawerTheme` (removed `bottomNavigationBarTheme`)

### Fixed
- Web: fixed all dashboard pages to match actual API response structures
- API paginated responses use `data.data` (not `data.audits`/`data.templates`)
- Prisma includes return nested objects (`store.name`, `auditor.name`) not flat fields
- Announcements use `totalRecipients` not `totalTargetUsers`
- Analytics endpoints return aggregate stats, not per-user arrays

## [0.7.0] - 2025-02-09

### Added
- **Planograms / Visual Merchandising** — HQ creates templates with reference photos, stores submit implementation photos, HQ approves or requests revision
- **Corrective Actions (CAPA)** — standalone module, auto-created from audit findings, checklist failures (score < 70%), and high-priority issues
- **Gamification** — points for completing actions, badges for milestones, leaderboards by store/region/global
- Points auto-awarded in tasks, checklists, audits, issues, CAPAs, planograms
- CAPA schedulers: overdue check (8AM daily), due-soon notifications (9AM daily)
- Gamification schedulers: weekly reset (Monday 00:00), monthly reset (1st 00:00)
- WebSocket events for CAPA, planograms, and gamification

## [0.6.0] - 2025-02-08

### Added
- **Checklists / Digital SOPs** — templates with items, daily/weekly/monthly submissions, completion scoring, compliance dashboard
- **Store Audits & Inspections** — templates with sections and weighted questions, audit lifecycle (schedule/start/answer/complete), findings with corrective actions
- **Announcement Read Receipts** — view/acknowledge tracking, recipient list with status, reminder push notifications

## [0.5.0] - 2025-02-07

### Added
- **Comprehensive audit logging** — 29+ audit points across auth, issues, tasks, receiving, users, stores, announcements, checklists, audits, CAPAs, planograms, gamification
- `GET /audit/user/:userId`, `GET /audit/entity/:entityType/:entityId`, `GET /audit/activity`

## [0.4.0] - 2025-02-06

### Added
- **Issue recategorize & auto-reassign** — `POST /issues/:id/recategorize` changes category and finds new best-fit assignee
- Web: "Cambiar Categoria" button with modal picker
- Mobile: category selector dialog
- Web announcement cover image display
- Web task detail: per-store assignment breakdown with status badges

## [0.3.0] - 2025-02-04

### Added
- **Database indexes** — 26 indexes on FK and status columns for query performance
- **Mobile offline sync** — real API calls for task completion, receiving operations, discrepancy reports, issue lifecycle; queue fallback when offline
- Web: reusable `PhotoGallery` component with lightbox, `PhotoUpload` with drag-and-drop
- Web: receiving and issue detail modals with photo galleries
- Next.js API proxy to fix CORS
- Demo seed script

### Changed
- Seed data: store manager gets `issueCategories: [MAINTENANCE, CLEANING, PERSONNEL, INVENTORY]`

### Removed
- Unused mobile deps: `retrofit`, `reactive_forms`, `flutter_svg`, `cached_network_image`, `shimmer`, `package_info_plus`

## [0.2.0] - 2025-02-02

### Added
- **Issue auto-assignment** — assigns to least-busy user in store matching issue category; falls back to Store Manager
- **"Asignadas a Mi" view** — 3-way segmented toggle on mobile (Todas / Mis Reportes / Asignadas a Mi)
- **Push notifications** on issue assignment (FCM, mock mode until Firebase configured)
- **PO barcode scanning** in receiving via `mobile_scanner`
- **MinIO file upload** — photos, signatures, videos with auto-bucket creation
- Shared widgets: `BarcodeScannerSheet`, `SignatureCaptureWidget`, `MediaPickerWidget`
- WebSocket auto-refresh on `issueAssignedToMe` event

## [0.1.0] - 2025-01-30

### Added
- Initial release: monorepo with API (NestJS), Web (Next.js 14), Mobile (Flutter)
- Task management — HQ creates daily plans, assigns to stores
- Receiving management — create, start, complete with signature, report discrepancies
- Issue reporting — categories, priorities, status flow with verification
- Verification queue — approve/reject completed tasks
- Announcements — HQ broadcasts to stores
- JWT authentication with role-based access (5 roles)
- WebSocket real-time events via Socket.io
- Push notifications via Firebase Cloud Messaging

### Removed
- Docker configuration (switched to native local development)
- GitLab CI/CD pipeline (removed after Docker stages deprecated)
