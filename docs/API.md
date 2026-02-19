# Plexo Operations - API Documentation

Base URL: `http://localhost:3001/api/v1`

Swagger UI: `http://localhost:3001/api/docs`

## Authentication

All endpoints (except login) require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@plexo.com.do",
  "password": "admin123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@plexo.com.do",
    "name": "Admin",
    "role": "OPERATIONS_MANAGER",
    "isSuperAdmin": true,
    "storeId": null,
    "storeName": null,
    "departmentId": null,
    "departmentName": null,
    "moduleAccess": ["tasks", "receiving", "issues", "verification", "checklists", "audits", "corrective_actions", "planograms", "communications", "gamification", "training", "reports", "stores", "users"]
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token. Returns same response shape as login.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/profile
Get current user's profile. Requires Bearer token.

**Response:**
```json
{
  "id": "uuid",
  "email": "admin@plexo.com.do",
  "name": "Admin",
  "role": "OPERATIONS_MANAGER",
  "isSuperAdmin": true,
  "storeId": null,
  "storeName": null,
  "departmentId": null,
  "departmentName": null,
  "moduleAccess": ["tasks", "receiving", "issues", "verification", "checklists", "audits", "corrective_actions", "planograms", "communications", "gamification", "training", "reports", "stores", "users"]
}
```

---

## Users

### GET /users
List all users (paginated).

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `role` (string, optional): Filter by role
- `storeId` (string, optional): Filter by store

### POST /users
Create a new user.

**Request Body:**
```json
{
  "email": "nuevo@plexo.com.do",
  "password": "Password123!",
  "name": "Nombre Completo",
  "role": "STORE_MANAGER",
  "storeId": "uuid"
}
```

**Roles** are DB-driven — see the Roles section below. Default roles:
- `OPERATIONS_MANAGER` (level 100) - HQ Operations Manager (full access)
- `HQ_TEAM` (level 80) - HQ Team member
- `REGIONAL_SUPERVISOR` (level 60) - Regional supervisor
- `STORE_MANAGER` (level 40) - Store manager
- `DEPT_SUPERVISOR` (level 20) - Department supervisor

New roles can be created via `POST /roles`. Verification hierarchy uses the `level` field (higher level verifies lower).

**Super Admin:**
Users with `isSuperAdmin: true` bypass all module access checks and can access the permissions and roles admin pages.

---

## Module Access (Permissions)

DB-configurable module permissions per role. Super admins can toggle which modules each role can access.

**Modules:** `tasks`, `receiving`, `issues`, `verification`, `checklists`, `audits`, `corrective_actions`, `planograms`, `communications`, `gamification`, `training`, `reports`, `stores`, `users`

### GET /module-access/my-modules
Get accessible modules for the current user. Super admins get all modules.

**Response:**
```json
{
  "modules": ["tasks", "receiving", "issues", "verification", "checklists", "audits"]
}
```

### GET /module-access/grid
Get full role-module access grid. *Super admin only.*

**Response:**
```json
{
  "OPERATIONS_MANAGER": { "tasks": true, "receiving": true, ... },
  "HQ_TEAM": { "tasks": true, "receiving": true, ... },
  "STORE_MANAGER": { "tasks": true, "reports": false, ... }
}
```

### PATCH /module-access/:role
Bulk update module access for a role. *Super admin only.*

**Request Body:**
```json
{
  "modules": { "reports": true, "stores": false }
}
```

**Response:**
```json
{ "message": "Permisos actualizados" }
```

---

## Roles

DB-driven roles with hierarchy levels. Creating a role auto-creates 13 `RoleModuleAccess` rows (all `hasAccess=false`).

### GET /roles
List all roles with user counts. *Super admin only.*

**Response:**
```json
[
  {
    "id": "uuid",
    "key": "STORE_MANAGER",
    "label": "Gerente de Tienda",
    "description": "Manages a single store",
    "color": "orange",
    "level": 40,
    "isActive": true,
    "sortOrder": 3,
    "userCount": 12
  }
]
```

### GET /roles/active
List active roles (for dropdowns). *Any authenticated user.*

**Response:**
```json
[
  { "id": "uuid", "key": "STORE_MANAGER", "label": "Gerente de Tienda", "color": "orange", "level": 40, "sortOrder": 3 }
]
```

### POST /roles
Create a new role. *Super admin only.*

**Request Body:**
```json
{
  "key": "AREA_MANAGER",
  "label": "Gerente de Area",
  "description": "Manages multiple stores in an area",
  "color": "teal",
  "level": 50,
  "sortOrder": 5
}
```

- `key` must be UPPER_SNAKE_CASE (`/^[A-Z][A-Z0-9_]*$/`), immutable after creation
- `level` determines verification hierarchy (higher verifies lower)

### PATCH /roles/:id
Update a role (key cannot be changed). *Super admin only.*

```json
{
  "label": "Updated Label",
  "level": 55,
  "color": "green",
  "isActive": false
}
```

### DELETE /roles/:id
Deactivate a role. Refuses if active users are assigned to it. *Super admin only.*

---

## Stores

### GET /stores
List all stores.

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "CHU",
    "name": "Plexo Churchill",
    "address": "Av. Winston Churchill",
    "regionId": "uuid",
    "region": {
      "id": "uuid",
      "name": "Distrito Nacional"
    }
  }
]
```

### GET /stores/regions
List all regions.

### GET /stores/departments
List all departments.

### PATCH /stores/:id/tier
Set store tier and override flag. *Super admin only.*

**Request Body:**
```json
{ "tier": "MEDIUM", "override": true }
```
Tiers: `SMALL` (1-15 employees), `MEDIUM` (16-40), `LARGE` (41+). When `override` is true, the daily scheduler will not auto-update the tier.

### GET /stores/:id/departments
List active departments for a store.

### PATCH /stores/:id/departments
Set which departments are active for a store. *Super admin only.*

**Request Body:**
```json
{ "departmentIds": ["uuid1", "uuid2"] }
```

---

## Receiving (Recepciones)

### GET /receiving
List receivings with filtering and pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `storeId` (string, optional)
- `regionId` (string, optional)
- `status` (string, optional): PENDING, IN_PROGRESS, COMPLETED, WITH_ISSUE, DID_NOT_ARRIVE
- `supplierType` (string, optional): DISTRIBUTION_CENTER, THIRD_PARTY
- `date` (string, optional): Filter by date (YYYY-MM-DD)
- `startDate` / `endDate` (string, optional): Date range

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "storeId": "uuid",
      "store": {
        "id": "uuid",
        "name": "Plexo Churchill",
        "code": "CHU"
      },
      "supplierType": "DISTRIBUTION_CENTER",
      "supplierName": "Centro de Distribución Principal",
      "poNumber": "PO-2024-001234",
      "scheduledTime": "2024-12-30T08:00:00Z",
      "arrivalTime": null,
      "status": "PENDING",
      "verifiedBy": null,
      "notes": null,
      "photoUrls": [],
      "signatureUrl": null,
      "driverName": "Juan Pérez",
      "truckPlate": "A123456",
      "itemCount": 50,
      "discrepancies": [],
      "discrepancyCount": 0,
      "createdAt": "2024-12-30T06:00:00Z",
      "updatedAt": "2024-12-30T06:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### POST /receiving
Create a new receiving.

**Request Body:**
```json
{
  "storeId": "uuid",
  "supplierType": "DISTRIBUTION_CENTER",
  "supplierName": "Centro de Distribución Principal",
  "poNumber": "PO-2024-001234",
  "scheduledTime": "2024-12-30T08:00:00Z",
  "driverName": "Juan Pérez",
  "truckPlate": "A123456",
  "itemCount": 50,
  "notes": "Entrega de temporada"
}
```

**Fields:**
- `storeId` (required): UUID of the store
- `supplierType` (required): DISTRIBUTION_CENTER or THIRD_PARTY
- `supplierName` (required): Name of the supplier
- `poNumber` (optional): Purchase Order number (can be scanned via barcode)
- `scheduledTime` (optional): Expected arrival time
- `driverName` (optional): Driver name
- `truckPlate` (optional): Truck license plate
- `itemCount` (optional): Expected number of items
- `notes` (optional): Additional notes

### GET /receiving/:id
Get a single receiving by ID.

### PATCH /receiving/:id
Update a receiving.

### POST /receiving/:id/start
Start a receiving (mark truck arrived).

**Status Transition:** `PENDING` → `IN_PROGRESS`

**Response:** Updated receiving object with `arrivalTime` set to now.

### POST /receiving/:id/complete
Complete a receiving with signature.

**Request Body:**
```json
{
  "signatureUrl": "https://storage.example.com/signatures/abc.png",
  "itemCount": 48,
  "notes": "Faltaron 2 cajas",
  "photoUrls": ["https://storage.example.com/photos/1.jpg"]
}
```

**Status Transition:**
- `IN_PROGRESS` → `COMPLETED` (if no discrepancies)
- `IN_PROGRESS` → `WITH_ISSUE` (if has discrepancies)

### POST /receiving/:id/did-not-arrive
Mark a receiving as not arrived.

**Request Body:**
```json
{
  "notes": "El camión no llegó a la hora programada"
}
```

**Status Transition:** `PENDING` → `DID_NOT_ARRIVE`

### POST /receiving/:id/discrepancy
Report a discrepancy during receiving.

**Request Body:**
```json
{
  "type": "MISSING",
  "productInfo": "Coca-Cola 2L x24 - SKU: 123456",
  "quantity": 5,
  "notes": "Faltaron 5 cajas",
  "photoUrls": ["https://storage.example.com/photos/discrepancy.jpg"]
}
```

**Discrepancy Types:**
- `MISSING` - Missing items
- `DAMAGED` - Damaged items
- `WRONG_PRODUCT` - Wrong product received

### DELETE /receiving/discrepancy/:discrepancyId
Remove a discrepancy (only before completion).

### GET /receiving/dashboard
Get dashboard statistics.

**Query Parameters:**
- `storeId` (optional)
- `regionId` (optional)
- `startDate` / `endDate` (optional)

**Response:**
```json
{
  "stats": {
    "total": 100,
    "pending": 10,
    "inProgress": 5,
    "completed": 75,
    "withIssue": 8,
    "didNotArrive": 2,
    "totalDiscrepancies": 15
  },
  "supplierMetrics": [...],
  "recentReceivings": [...],
  "pendingReceivings": [...]
}
```

---

## Status Flow Diagram

```
PENDING
  ├─→ IN_PROGRESS (start)
  │     ├─→ COMPLETED (complete - no issues)
  │     └─→ WITH_ISSUE (complete - has discrepancies)
  └─→ DID_NOT_ARRIVE (didNotArrive)

Terminal States: COMPLETED, WITH_ISSUE, DID_NOT_ARRIVE
```

---

## File Uploads

File uploads are handled via MinIO (S3-compatible storage). All upload endpoints accept `multipart/form-data` with a `file` field.

### POST /uploads/photo
Upload a photo (receiving evidence, discrepancy photos, issue photos).

**Constraints:**
- Max size: 10MB
- Accepted types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`

**Response:**
```json
{
  "url": "http://<minio-host>:9000/photos/receiving/<uuid>.jpg"
}
```

### POST /uploads/signature
Upload a signature image (receiving completion).

**Constraints:**
- Max size: 5MB
- Accepted types: `image/png`

**Response:**
```json
{
  "url": "http://<minio-host>:9000/signatures/<uuid>.png"
}
```

### POST /uploads/video
Upload a video file.

**Constraints:**
- Max size: 50MB
- Accepted types: `video/mp4`, `video/quicktime`, `video/webm`

**Response:**
```json
{
  "url": "http://<minio-host>:9000/photos/videos/<uuid>.mp4"
}
```

### MinIO Configuration

The API uses two MinIO-related endpoint settings:

| Env Variable | Purpose | Example |
|---|---|---|
| `MINIO_ENDPOINT` | Connection endpoint (API → MinIO) | `localhost` |
| `MINIO_PUBLIC_ENDPOINT` | URL in returned file URLs (must be reachable by clients) | `192.168.1.100` |

Buckets (`photos`, `signatures`) are auto-created on API startup with public-read access policies.

---

## Issues (Incidencias)

### POST /issues
Create a new issue. **Auto-assigns** to the least-busy user in the store whose `issueCategories` include the issue's category. Falls back to Store Manager if no match.

**Request Body:**
```json
{
  "storeId": "uuid",
  "category": "MAINTENANCE",
  "priority": "MEDIUM",
  "title": "Aire acondicionado roto",
  "description": "El aire del segundo piso no enfría"
}
```

**Categories:** `MAINTENANCE`, `CLEANING`, `SECURITY`, `IT_SYSTEMS`, `PERSONNEL`, `INVENTORY`

**Priorities:** `LOW`, `MEDIUM`, `HIGH`

**Response:** Issue object with `status: "ASSIGNED"` and `assignedTo` populated (if auto-assigned).

### GET /issues
List issues (paginated, role-filtered).

**Query Parameters:**
- `page`, `limit`, `storeId`, `regionId`, `category`, `status`, `priority`
- `reportedById`, `assignedToId`, `escalatedOnly`
- `startDate`, `endDate`

### GET /issues/my-issues
Issues reported by the current user.

### GET /issues/assigned
Issues assigned to the current user (excludes resolved).

### GET /issues/dashboard
Dashboard stats with category breakdown.

### POST /issues/:id/assign
Manually assign an issue. Sends push notification to assignee.

```json
{ "assignedToId": "uuid" }
```

### POST /issues/:id/recategorize
Change an issue's category and auto-reassign. Only allowed on open issues (REPORTED, ASSIGNED, IN_PROGRESS).

**Roles:** OPERATIONS_MANAGER, HQ_TEAM, REGIONAL_SUPERVISOR, STORE_MANAGER

**Request Body:**
```json
{ "category": "IT_SYSTEMS" }
```

**Behavior:**
- Updates the category
- Runs `findBestAssignee()` with the new category
- If assignee found → status becomes `ASSIGNED`, push notification sent
- If no assignee found → status becomes `REPORTED`, `assignedTo` set to null

### POST /issues/:id/start
Start working on an assigned issue. Status: `ASSIGNED` → `IN_PROGRESS`.

### POST /issues/:id/resolve
Resolve an issue. Requires `resolutionNotes`. May enter `PENDING_VERIFICATION` depending on user role.

### POST /issues/:id/escalate
Escalate an issue. Sets priority to `HIGH`.

### Issue Status Flow

```
REPORTED → ASSIGNED (auto or manual)
  → IN_PROGRESS (start)
    → PENDING_VERIFICATION (resolve, if role requires verification)
      → VERIFIED | REJECTED
    → RESOLVED (resolve, if auto-verified role)
```

### GET /announcements/:id/recipients
Get paginated recipient list with read/ack status per user. *HQ only.*

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```json
{
  "recipients": [
    {
      "userId": "uuid",
      "userName": "Nombre",
      "userEmail": "email@plexo.com.do",
      "storeName": "Plexo Churchill",
      "role": "STORE_MANAGER",
      "status": "read",
      "viewedAt": "2024-12-30T10:00:00Z",
      "acknowledgedAt": null
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### POST /announcements/:id/send-reminder
Send push notification to users who haven't read/acknowledged the announcement. *HQ only.*

---

## Checklists / Digital SOPs

### POST /checklists
Create a checklist template. *HQ only.*

**Request Body:**
```json
{
  "title": "Apertura de Tienda",
  "description": "Checklist diario de apertura",
  "departmentId": "uuid",
  "frequency": "DAILY",
  "scope": "ALL",
  "targetStoreIds": [],
  "targetRegionIds": [],
  "items": [
    { "order": 0, "title": "Verificar limpieza de entrada", "requiresPhoto": false, "requiresNote": false }
  ]
}
```

**Frequency:** `DAILY`, `WEEKLY`, `MONTHLY`, `ONE_TIME`

### GET /checklists
List checklist templates (paginated).

**Query Parameters:**
- `page`, `limit`, `departmentId`, `frequency`, `search`

### GET /checklists/:id
Get template detail with items.

### PATCH /checklists/:id
Update a checklist template. *HQ only.*

### DELETE /checklists/:id
Soft-delete a checklist template. *HQ only.*

### GET /checklists/dashboard
Compliance dashboard — completion rates by store/checklist. *HQ/Regional.*

**Query Parameters:**
- `storeId`, `regionId`, `dateFrom`, `dateTo`

### GET /checklists/submissions
List submissions with filters.

**Query Parameters:**
- `page`, `limit`, `storeId`, `dateFrom`, `dateTo`, `status`, `templateId`

### GET /checklists/store/:storeId
Get checklists assigned to a store with today's submission status. Used by mobile.

### POST /checklists/:id/submit
Start a submission for today. Enforces one submission per template/store/date.

### GET /checklists/submissions/:id
Get submission detail with item responses.

### POST /checklists/submissions/:id/respond
Complete a checklist item.

**Request Body:**
```json
{
  "itemId": "uuid",
  "isCompleted": true,
  "photoUrls": ["url"],
  "notes": "Todo en orden"
}
```

### POST /checklists/submissions/:id/complete
Mark submission as complete. Calculates score (completed/total * 100).

**Submission Status Flow:**
```
PENDING → IN_PROGRESS (first item response) → COMPLETED (manual complete) | EXPIRED
```

---

## Store Audits & Inspections

### Templates

#### POST /store-audits/templates
Create an audit template with sections and questions. *HQ only.*

**Request Body:**
```json
{
  "name": "Inspeccion General de Tienda",
  "description": "Auditoria mensual completa",
  "sections": [
    {
      "order": 0,
      "title": "Limpieza y Orden",
      "weight": 1.0,
      "questions": [
        { "order": 0, "text": "Pisos limpios y secos", "questionType": "SCORE", "maxScore": 5, "requiresPhoto": false }
      ]
    }
  ]
}
```

**Question Types:** `SCORE` (0 to maxScore), `YES_NO`, `TEXT`

#### GET /store-audits/templates
List audit templates.

#### GET /store-audits/templates/:id
Get template detail with sections and questions.

#### PATCH /store-audits/templates/:id
Update audit template. *HQ only.*

### Dashboard

#### GET /store-audits/dashboard
Audit compliance dashboard — avg scores, open findings, overdue actions. *HQ/Regional.*

**Query Parameters:**
- `storeId`, `regionId`, `dateFrom`, `dateTo`

### Audit Lifecycle

#### POST /store-audits/schedule
Schedule an audit for a store.

**Request Body:**
```json
{
  "templateId": "uuid",
  "storeId": "uuid",
  "scheduledDate": "2024-12-30",
  "auditorId": "uuid"
}
```

#### GET /store-audits
List audits with filters. Response includes `templateName`, nested `store` and `auditor` objects.

**Query Parameters:**
- `page`, `limit`, `storeId`, `status`, `dateFrom`, `dateTo`, `auditorId`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "templateId": "uuid",
      "templateName": "Inspeccion General",
      "store": { "id": "uuid", "name": "Plexo Churchill", "code": "CHU" },
      "auditor": { "id": "uuid", "name": "Auditor Name", "email": "...", "role": "..." },
      "scheduledDate": "2025-01-15",
      "status": "COMPLETED",
      "overallScore": 85.5,
      "findings": [],
      "answers": []
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
}
```

#### GET /store-audits/:id
Get audit detail with template (sections/questions), answers, findings, and corrective actions.

#### POST /store-audits/:id/start
Begin an audit. Status: `SCHEDULED` → `IN_PROGRESS`.

#### POST /store-audits/:id/answer
Submit an answer for a question.

**Request Body:**
```json
{
  "questionId": "uuid",
  "score": 4,
  "booleanValue": null,
  "textValue": null,
  "photoUrls": [],
  "notes": ""
}
```

#### POST /store-audits/:id/finding
Report a finding during audit.

**Request Body:**
```json
{
  "sectionId": "uuid",
  "severity": "HIGH",
  "title": "Extintores vencidos",
  "description": "2 extintores en area de almacen con fecha vencida",
  "photoUrls": ["url"]
}
```

**Severity:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

#### POST /store-audits/:id/complete
Complete audit. Calculates weighted overall score.

**Score Calculation:**
```
Per section: sectionScore = sum(answer scores) / sum(maxScores)
  YES_NO: score = booleanValue ? maxScore : 0
Overall: (sum(sectionScore * weight) / totalWeight) * 100
```

### Findings & Corrective Actions

#### POST /store-audits/findings/:id/corrective-action
Create a corrective action for a finding.

**Request Body:**
```json
{
  "assignedToId": "uuid",
  "dueDate": "2024-12-30",
  "description": "Reemplazar extintores vencidos"
}
```

#### PATCH /store-audits/corrective-actions/:id
Update corrective action status.

**Request Body:**
```json
{
  "status": "COMPLETED",
  "completionNotes": "Extintores reemplazados",
  "completionPhotoUrls": ["url"]
}
```

**Corrective Action Flow:**
```
Finding OPEN → ACTION_ASSIGNED (action created)
Action: PENDING → IN_PROGRESS → COMPLETED → VERIFIED
Finding: OPEN → ACTION_ASSIGNED → ... → VERIFIED
```

**Audit Status Flow:**
```
SCHEDULED → IN_PROGRESS (start) → COMPLETED (complete) | CANCELLED
```

---

## Notifications

### POST /notifications/register-device
Register an FCM device token.

```json
{
  "token": "fcm-token-string",
  "platform": "IOS"
}
```

**Platforms:** `IOS`, `ANDROID`

---

## WebSocket Events

Connect to `/events` namespace for real-time updates.

**Events:**
- `receiving:created` - New receiving created
- `receiving:updated` - Receiving status/details changed
- `receiving:completed` - Receiving finalized
- `discrepancy:reported` - New discrepancy added
- `issue:created` - New issue created
- `issue:updated` - Issue status/details changed
- `issue:assigned` - Issue assigned (broadcast to store)
- `issue:assigned_to_me` - Issue assigned to specific user (sent to `user:{id}`)
- `issue:resolved` - Issue resolved
- `issue:escalated` - Issue escalated
- `checklist:submission_completed` - Checklist submission completed (to store + HQ)
- `audit:scheduled` - Audit scheduled (to store + HQ)
- `audit:completed` - Audit completed with score (to store + HQ)
- `audit:finding_reported` - Finding reported during audit (to store + HQ)
- `audit:corrective_action_assigned` - Corrective action assigned (to `user:{id}`)
- `capa:created` - Corrective action created (to assignee + store)
- `capa:overdue` - Action marked overdue (to assignee + store + HQ)
- `capa:due_soon` - Due soon reminder (to assignee)
- `capa:completed` - Action completed (to store + HQ)
- `capa:verified` - Action verified (to store + HQ)
- `planogram:submitted` - Planogram submitted (to HQ)
- `planogram:approved` - Submission approved (to submitter + store)
- `planogram:revision_needed` - Revision requested (to submitter + store)
- `planogram:resubmitted` - Resubmission (to HQ)
- `gamification:points_awarded` - Points earned (to user)
- `gamification:badge_earned` - Badge earned (to user)

**Rooms:**
- `store:{storeId}` - Store-specific events
- `hq` - HQ monitoring (all events)
- `user:{userId}` - User-specific events

---

## Audit Logging

All user-triggered data mutations and authentication events are automatically logged to the audit trail. This provides comprehensive accountability for every action in the system.

**Covered modules:**
- **Auth** — LOGIN, LOGOUT
- **Issues** — CREATED, UPDATED, ASSIGNED, STATUS_CHANGED (start progress), UPDATED (recategorize), ESCALATED
- **Tasks** — CREATED, UPDATED, DELETED
- **Receiving** — CREATED, UPDATED, STATUS_CHANGED (start, did-not-arrive), COMPLETED, UPDATED (add/remove discrepancy)
- **Users** — CREATED, UPDATED, DELETED (soft delete)
- **Stores** — CREATED, UPDATED, DELETED (soft delete)
- **Announcements** — CREATED, UPDATED, STATUS_CHANGED (publish, archive), DELETED
- **Checklists** — CREATED, UPDATED, DELETED, COMPLETED (submission)
- **Store Audits** — CREATED, COMPLETED, FINDING_REPORTED, CORRECTIVE_ACTION_CREATED
- **Corrective Actions** — CREATED, UPDATED (status transitions)
- **Planograms** — CREATED, UPDATED, APPROVED, REVISION_REQUESTED, RESUBMITTED
- **Gamification** — POINTS_AWARDED, BADGE_EARNED, UPDATED (point config)

**Entity types:** `TASK_ASSIGNMENT`, `ISSUE`, `RECEIVING`, `USER`, `STORE`, `TASK`, `ANNOUNCEMENT`, `CHECKLIST`, `STORE_AUDIT`, `AUDIT_FINDING`, `CORRECTIVE_ACTION`, `PLANOGRAM_TEMPLATE`, `PLANOGRAM_SUBMISSION`, `POINT_TRANSACTION`, `BADGE`

**Actions:** `CREATED`, `STATUS_CHANGED`, `ASSIGNED`, `COMPLETED`, `RESOLVED`, `VERIFICATION_SUBMITTED`, `VERIFIED`, `REJECTED`, `UPDATED`, `ESCALATED`, `DELETED`, `LOGIN`, `LOGOUT`, `APPROVED`, `REVISION_REQUESTED`, `RESUBMITTED`, `POINTS_AWARDED`, `BADGE_EARNED`

### GET /audit/user/:userId
Get audit trail for a specific user.

### GET /audit/entity/:entityType/:entityId
Get audit trail for a specific entity.

### GET /audit/activity
Get recent activity feed (optionally filtered by store).

---

## Corrective Actions (CAPA)

Standalone corrective/preventive action module. Auto-created from audit findings, checklist failures (score < 70%), and high-priority issues. Also supports manual creation.

**Source types:** `AUDIT_FINDING`, `CHECKLIST_FAILURE`, `ISSUE`, `MANUAL`

### POST /corrective-actions
Create a corrective action. *HQ only.*

**Request Body:**
```json
{
  "sourceType": "MANUAL",
  "title": "Implementar protocolo de temperatura",
  "description": "Documentar y capacitar personal",
  "assignedToId": "uuid",
  "storeId": "uuid",
  "dueDate": "2025-02-15",
  "priority": "HIGH"
}
```

### GET /corrective-actions
List with filters (role-scoped — store users see only their store).

**Query Parameters:**
- `page`, `limit`, `status`, `storeId`, `assignedToId`, `sourceType`, `overdue`, `dateFrom`, `dateTo`

### GET /corrective-actions/my-actions
Actions assigned to current user.

### GET /corrective-actions/dashboard
Dashboard stats (total, by status, by store, avg resolution time). *HQ only.*

### GET /corrective-actions/:id
Get detail with source info, assignee, store.

### PATCH /corrective-actions/:id
Update status/completion.

**Request Body:**
```json
{
  "status": "COMPLETED",
  "completionNotes": "Protocolo implementado",
  "completionPhotoUrls": ["url"]
}
```

**Status Flow:**
```
PENDING → IN_PROGRESS → COMPLETED → VERIFIED (HQ only)
OVERDUE → IN_PROGRESS or COMPLETED
```

**Scheduler (automatic):**
- Daily 8:00 AM: marks past-due actions as `OVERDUE`
- Daily 9:00 AM: sends due-soon notifications (1 and 3 days before)

---

## Planograms (Visual Merchandising)

HQ creates planogram templates with reference photos → stores submit implementation photos → HQ reviews (approve/revise).

### Templates

#### POST /planograms/templates
Create template with reference photos. *HQ only.*

**Request Body:**
```json
{
  "name": "Exhibicion Navidad 2024",
  "description": "Montaje navideño en entrada",
  "referencePhotoUrls": ["url1", "url2"],
  "targetStoreIds": ["uuid1", "uuid2"],
  "targetRegionIds": [],
  "dueDate": "2024-12-20"
}
```

#### GET /planograms/templates
List active templates.

#### GET /planograms/templates/:id
Template detail with submissions.

#### PATCH /planograms/templates/:id
Update template. *HQ only.*

#### DELETE /planograms/templates/:id
Deactivate template. *HQ only.*

### Store View

#### GET /planograms/my-pending
Templates without approved submission for the current user's store. *Store roles only.*

### Dashboard

#### GET /planograms/dashboard
Compliance rates by store and template. *HQ only.*

### Submissions

#### GET /planograms/submissions
List submissions with filters.

**Query Parameters:**
- `page`, `limit`, `storeId`, `status`, `templateId`, `dateFrom`, `dateTo`

#### GET /planograms/submissions/:id
Submission detail.

#### POST /planograms/templates/:id/submit
Submit photos for a template. Only one submission per store per template — returns `400` if a submission already exists (use the resubmit endpoint instead).

**Request Body:**
```json
{
  "storeId": "uuid",
  "photoUrls": ["url1", "url2"],
  "notes": "Exhibición montada"
}
```

#### POST /planograms/submissions/:id/review
Approve or request revision. *HQ only.*

**Request Body:**
```json
{
  "status": "APPROVED",
  "reviewNotes": "Bien ejecutado"
}
```

**Status values:** `APPROVED`, `NEEDS_REVISION`

#### POST /planograms/submissions/:id/resubmit
Resubmit after revision request.

**Submission Status Flow:**
```
PENDING_REVIEW → APPROVED
PENDING_REVIEW → NEEDS_REVISION → RESUBMITTED → APPROVED
```

---

## Gamification

Points for completing actions, badges for milestones, leaderboards.

Points are automatically awarded when users complete tasks, checklists, audits, issues, CAPAs, and planograms. Badge criteria are checked after each point award.

### GET /gamification/my-profile
Current user's points, rank, and earned badges.

**Response:**
```json
{
  "totalPoints": 285,
  "weeklyPoints": 45,
  "monthlyPoints": 120,
  "rank": 2,
  "badges": [
    { "id": "uuid", "name": "Primera Tarea", "isEarned": true, "earnedAt": "..." }
  ]
}
```

### GET /gamification/leaderboard/:type
Leaderboard by type with filters. Replaces the legacy `/leaderboard` endpoint.

**Path Parameters:**
- `type`: `individual`, `store`, `department`

**Query Parameters:**
- `period`: `weekly`, `monthly`, `allTime` (default: `weekly`)
- `storeId`: filter by store (individual, department)
- `regionId`: filter by region (individual, store)
- `role`: filter by role key (individual only)
- `tier`: filter by store tier `SMALL`/`MEDIUM`/`LARGE` (store only)
- `departmentId`: filter by department (department only)

**Response (individual):**
```json
{
  "entries": [
    { "userId": "uuid", "userName": "...", "role": "STORE_MANAGER", "storeName": "...", "departmentName": "...", "weeklyPoints": 45, "monthlyPoints": 120, "totalPoints": 285, "rank": 1 }
  ],
  "period": "weekly",
  "type": "individual"
}
```

**Response (store):**
```json
{
  "entries": [
    { "storeId": "uuid", "storeName": "...", "storeCode": "PL01", "tier": "LARGE", "regionName": "...", "weeklyPoints": 450, "monthlyPoints": 1200, "totalPoints": 2850, "perCapitaScore": 15.2, "complianceRate": 85, "employeeCount": 30, "rank": 1 }
  ],
  "period": "weekly",
  "type": "store"
}
```

**Response (department):**
```json
{
  "entries": [
    { "departmentId": "uuid", "departmentName": "...", "storeId": "uuid", "storeName": "...", "weeklyPoints": 120, "monthlyPoints": 400, "totalPoints": 900, "perCapitaScore": 12.0, "employeeCount": 10, "rank": 1 }
  ],
  "period": "weekly",
  "type": "department"
}
```

### GET /gamification/leaderboard
Legacy individual leaderboard (backwards compatible). Redirects to individual type.

**Query Parameters:**
- `scope`: `store`, `region`, `all` (default: `all`)
- `period`: `weekly`, `monthly`, `allTime` (default: `weekly`)

### GET /gamification/store/:storeId/compliance
Weekly and monthly compliance rates for a store.

**Response:**
```json
{ "storeId": "uuid", "storeName": "...", "weeklyComplianceRate": 85, "monthlyComplianceRate": 78 }
```

### GET /gamification/badges
All badges with earn counts and current user's earn status.

### GET /gamification/users/:id/profile
Any user's gamification profile.

### GET /gamification/point-configs
List point configurations. *OPERATIONS_MANAGER only.*

### PATCH /gamification/point-configs/:actionType
Update points for an action type. *OPERATIONS_MANAGER only.*

**Request Body:**
```json
{ "points": 15, "description": "Completar una tarea asignada" }
```

**Quality Multiplier:** Resubmissions after rejection earn 50% of configured points. The `isFirstAttempt` flag is automatically set by the task and issue services when detecting a previous rejection.

**Default Point Values:**

| Action | Points |
|---|---|
| TASK_COMPLETED | 10 |
| CHECKLIST_COMPLETED | 10 |
| AUDIT_COMPLETED | 25 |
| ISSUE_RESOLVED | 15 |
| ISSUE_REPORTED | 5 |
| CAPA_COMPLETED | 20 |
| CAPA_VERIFIED | 10 |
| PLANOGRAM_APPROVED | 15 |
| ON_TIME_COMPLETION | 5 |
| PERFECT_AUDIT_SCORE | 50 |
| CAMPAIGN_EXECUTED | 15 |
| TRAINING_COMPLETED | 15 |
| PERFECT_TRAINING_SCORE | 25 |

**Scheduler:**
- Weekly (Monday 00:00): reset weeklyPoints to 0
- Monthly (1st 00:00): reset monthlyPoints to 0

---

## Training / LMS

Course management, enrollment lifecycle, and quiz assessment system.

### Courses

#### POST /training/courses
Create a course with optional lessons and quiz questions.

**Request Body:**
```json
{
  "title": "Recepcion de Mercancia",
  "description": "Procedimiento estandar para recepcion",
  "category": "OPERATIONS",
  "passingScore": 70,
  "isMandatory": true,
  "scope": "ALL",
  "targetStoreIds": [],
  "targetRoleIds": [],
  "certificationValidDays": 365,
  "estimatedDurationMinutes": 45,
  "lessons": [
    {
      "sortOrder": 0,
      "title": "Introduccion",
      "type": "TEXT",
      "content": "# Markdown content...",
      "estimatedMinutes": 10,
      "isRequired": true
    },
    {
      "sortOrder": 1,
      "title": "Quiz Final",
      "type": "QUIZ",
      "estimatedMinutes": 10,
      "questions": [
        {
          "sortOrder": 0,
          "questionText": "Pregunta?",
          "type": "MULTIPLE_CHOICE",
          "options": [
            { "text": "Opcion A", "isCorrect": false },
            { "text": "Opcion B", "isCorrect": true }
          ],
          "explanation": "Explicacion de la respuesta"
        }
      ]
    }
  ]
}
```

**Categories:** `OPERATIONS`, `CASH_MANAGEMENT`, `CUSTOMER_SERVICE`, `INVENTORY`, `COMPLIANCE`, `SAFETY`

**Lesson Types:** `TEXT`, `PDF`, `VIDEO`, `QUIZ`

**Question Types:** `MULTIPLE_CHOICE`, `TRUE_FALSE`

#### GET /training/courses
List courses with filters.

**Query Parameters:**
- `page`, `limit`, `category`, `status` (DRAFT/PUBLISHED/ARCHIVED), `search`, `isMandatory`

#### GET /training/courses/:id
Course detail with lessons, quiz questions, and enrollments (limited to 50).

#### PATCH /training/courses/:id
Update course metadata. *Creator or HQ only.*

#### DELETE /training/courses/:id
Soft-delete a course. *Creator or HQ only.*

### Lessons & Questions

#### POST /training/courses/:courseId/lessons
Add a lesson to a course.

#### PATCH /training/lessons/:id
Update a lesson.

#### DELETE /training/lessons/:id
Soft-delete a lesson (`isActive: false`).

#### POST /training/lessons/:lessonId/questions
Add a quiz question to a lesson.

#### PATCH /training/questions/:id
Update a quiz question.

#### DELETE /training/questions/:id
Soft-delete a question (`isActive: false`).

### Enrollment

#### POST /training/courses/:courseId/enroll
Bulk enroll users.

**Request Body:**
```json
{ "userIds": ["uuid1", "uuid2"] }
```

Uses `createMany` with `skipDuplicates` — safe to call repeatedly.

#### POST /training/courses/:courseId/enroll-by-role
Enroll all active users with a specific role.

**Request Body:**
```json
{ "roleId": "uuid" }
```

#### GET /training/my-courses
Current user's enrollments with progress.

**Query Parameters:**
- `status`: `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`

#### GET /training/my-courses/:enrollmentId
Enrollment detail with course, lessons, and progress per lesson.

### Enrollment Lifecycle

#### POST /training/enrollments/:id/start
Start a course. Status: `ASSIGNED` → `IN_PROGRESS`.

#### POST /training/progress/:enrollmentId/lessons/:lessonId/complete
Complete a text/pdf/video lesson. Must be `IN_PROGRESS` (not `ASSIGNED` or `COMPLETED`).

#### POST /training/progress/:enrollmentId/lessons/:lessonId/quiz
Submit quiz answers. Validates: answer count matches questions, no duplicates, valid question IDs.

**Request Body:**
```json
{
  "answers": [
    { "questionId": "uuid", "selectedOptionIndex": 0 }
  ]
}
```

**Response:** Score percentage and pass/fail result.

#### POST /training/enrollments/:id/complete
Complete a course. All required lessons must be completed. If course has `passingScore`, quiz scores must meet it. Awards gamification points on completion.

**Enrollment Status Flow:**
```
ASSIGNED → IN_PROGRESS (start)
  → lesson progress (complete lessons, submit quizzes)
  → COMPLETED (complete course — all lessons done, passing score met)
```

### Dashboard & Compliance

#### GET /training/dashboard
Training stats: total courses, enrollments by status, completion rate, overdue count.

#### GET /training/courses/:id/compliance
Per-store compliance breakdown: enrolled, completed, in-progress counts per store.

---

## Campaigns

Campaign execution: HQ creates campaigns, stores submit execution photos for review.

### Campaign Management (HQ)

#### POST /campaigns
Create a new campaign.

**Request Body:**
```json
{
  "title": "Campaign title",
  "description": "Instructions for stores",
  "type": "SEASONAL",
  "startDate": "2025-04-01",
  "endDate": "2025-04-15",
  "storeIds": ["store-uuid-1", "store-uuid-2"],
  "referencePhotos": ["https://..."]
}
```

**Types:** `PROMOTION`, `SEASONAL`, `PRODUCT_LAUNCH`, `PRICE_CHANGE`

#### GET /campaigns
List campaigns with pagination and filters (`?status=ACTIVE&type=SEASONAL&page=1&limit=20`).

#### GET /campaigns/:id
Get campaign detail with all submissions.

#### PATCH /campaigns/:id
Update campaign details.

#### PATCH /campaigns/:id/status
Change campaign status (`DRAFT` → `ACTIVE` → `COMPLETED`).

#### DELETE /campaigns/:id
Cancel a campaign (soft-delete).

#### GET /campaigns/dashboard
Campaign compliance dashboard: stats by store, completion rates.

### Campaign Submissions (Stores)

#### POST /campaigns/:id/submit
Submit campaign execution with photos.

**Request Body:**
```json
{
  "photos": ["https://..."],
  "notes": "Implementation notes"
}
```

#### PUT /campaigns/:id/submissions/:subId/resubmit
Resubmit after HQ requests revision.

#### GET /campaigns/my-pending
Get pending campaigns for the current user's store.

### Submission Review (HQ)

#### GET /campaigns/submissions
List all submissions with filters (`?status=PENDING_REVIEW&page=1&limit=20`).

#### GET /campaigns/submissions/:id
Get submission detail.

#### PATCH /campaigns/submissions/:id/review
Approve or request revision.

**Request Body:**
```json
{
  "status": "APPROVED",
  "feedback": "Optional reviewer feedback"
}
```

**Submission statuses:** `PENDING_REVIEW`, `APPROVED`, `NEEDS_REVISION`

---

## Demo Data

Run the seed scripts to populate the database with realistic demo data:

```bash
cd packages/database

# Base seed (stores, departments, roles, module access)
DATABASE_URL="postgresql://..." npm run seed

# Demo seed (users, tasks, issues, campaigns, training, etc.)
DATABASE_URL="postgresql://..." npm run seed:demo
```

### Demo Users

| Email | Password | Role | Store |
|-------|----------|------|-------|
| `admin@plexo.com.do` | `admin123` | OPERATIONS_MANAGER (Super Admin) | HQ |
| `gerente.duarte@plexo.com.do` | `admin123` | STORE_MANAGER | PL01 Duarte 78 |
| `gerente.herrera@plexo.com.do` | `admin123` | STORE_MANAGER | PL03 Herrera |
| `gerente.santiago@plexo.com.do` | `admin123` | STORE_MANAGER | PL16 Santiago |
| `gerente.27feb@plexo.com.do` | `admin123` | STORE_MANAGER | PL08 27 Febrero |
| `gerente.oriental@plexo.com.do` | `admin123` | STORE_MANAGER | PL10 Oriental |
| `supervisor.muebles@plexo.com.do` | `admin123` | DEPT_SUPERVISOR | PL01 Muebles |
| `supervisor.super@plexo.com.do` | `admin123` | DEPT_SUPERVISOR | PL03 Super |
| `supervisor.super.duarte@plexo.com.do` | `admin123` | DEPT_SUPERVISOR | PL01 Super |
| `supervisor.santiago@plexo.com.do` | `admin123` | REGIONAL_SUPERVISOR | PL16 Santiago |

### Demo Data Counts

| Module | Count |
|--------|-------|
| Users | 13 (5 base + 8 demo) |
| Receivings | 20 across 5 stores |
| Issues | 18 across 5 stores |
| Tasks | 10 with 37+ assignments |
| Announcements | 6 |
| Checklists | 3 templates, 6 submissions |
| Audits | 2 templates, 6 audits |
| Corrective Actions | 10 |
| Planograms | 3 templates, 8 submissions |
| Campaigns | 4 campaigns, 10 submissions |
| Training | 10 courses, 54 enrollments |
| Gamification | 9 users with points and badges |

---

## Error Responses

All errors return a consistent format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

Plexo Operations API v1.8
