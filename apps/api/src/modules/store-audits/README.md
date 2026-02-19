# Store Audits Module

Complete NestJS module for managing store audits, inspections, findings, and corrective actions.

## File Structure

```
store-audits/
├── dto/
│   ├── audit-query.dto.ts              # Query filters for listing audits
│   ├── create-audit-template.dto.ts    # Template creation with sections & questions
│   ├── create-corrective-action.dto.ts # Corrective action creation
│   ├── report-finding.dto.ts           # Finding/issue reporting during audit
│   ├── schedule-audit.dto.ts           # Schedule audit at a store
│   ├── store-audit-response.dto.ts     # All response DTOs
│   ├── submit-answer.dto.ts            # Submit answer to audit question
│   ├── update-corrective-action.dto.ts # Update corrective action status
│   └── index.ts                        # Barrel export
├── store-audits.controller.ts          # REST API endpoints
├── store-audits.module.ts              # NestJS module definition
├── store-audits.service.ts             # Business logic & scoring
└── README.md                           # This file
```

## API Endpoints

### Template Management (HQ Only)
- `POST /store-audits/templates` - Create audit template
- `GET /store-audits/templates` - List all templates
- `GET /store-audits/templates/:id` - Get template detail
- `PATCH /store-audits/templates/:id` - Update template

### Dashboard
- `GET /store-audits/dashboard` - Get audit metrics & stats

### Corrective Actions
- `POST /store-audits/findings/:id/corrective-action` - Create corrective action
- `PATCH /store-audits/corrective-actions/:id` - Update action status

### Audit Lifecycle
- `POST /store-audits/schedule` - Schedule audit (HQ/Regional)
- `GET /store-audits` - List audits with filters
- `GET /store-audits/:id` - Get audit detail
- `POST /store-audits/:id/start` - Start audit (Auditor only)
- `POST /store-audits/:id/answer` - Submit answer to question
- `POST /store-audits/:id/finding` - Report finding during audit
- `POST /store-audits/:id/complete` - Complete audit & calculate scores

## Features

### Template System
- Multi-section templates with weighted scoring
- Three question types: SCORE (0-N), YES_NO (boolean), TEXT (freeform)
- Customizable max scores per question
- Photo requirements per question

### Score Calculation
On audit completion, the service calculates:
1. **Section scores**: Sum of answer scores / sum of max scores
2. **Weighted total**: Sum of (section score × section weight)
3. **Overall score**: (weighted total / total weight) × 100

Formula:
- YES_NO questions: score = booleanValue ? maxScore : 0
- SCORE questions: score = answer.score (capped at maxScore)
- TEXT questions: not included in scoring

### Findings & Corrective Actions
- Severity levels: LOW, MEDIUM, HIGH, CRITICAL
- Finding statuses: OPEN → ACTION_ASSIGNED → IN_PROGRESS → RESOLVED → VERIFIED
- Corrective action statuses: PENDING → IN_PROGRESS → COMPLETED → VERIFIED
- Photo evidence support
- Due date tracking with overdue detection

### Status Transitions

**Audit Lifecycle:**
SCHEDULED → IN_PROGRESS → COMPLETED

**Finding Lifecycle:**
OPEN → ACTION_ASSIGNED → IN_PROGRESS → RESOLVED → VERIFIED

**Corrective Action Lifecycle:**
PENDING → IN_PROGRESS → COMPLETED → VERIFIED (→ OVERDUE if past due date)

### Permissions

**HQ Roles** (OPERATIONS_MANAGER, REGIONAL_SUPERVISOR, HQ_TEAM):
- Create/update templates
- Schedule audits
- View all audits
- Verify corrective actions

**Store Managers:**
- View own store audits
- Create corrective actions
- Update corrective actions (assigned to them)

**Assigned Auditors:**
- Start audits
- Submit answers
- Report findings
- Complete audits

### WebSocket Events

**Events emitted:**
- `audit:scheduled` - Audit scheduled
- `audit:started` - Audit began
- `audit:completed` - Audit finished with scores
- `audit:finding_reported` - New finding reported
- `corrective_action:created` - New corrective action
- `corrective_action:updated` - Action status changed
- `corrective_action:assigned_to_me` - Personal notification

**Rooms:**
- Store-specific: `store:{storeId}`
- HQ: `hq`
- User-specific: `user:{userId}`

### Audit Logging

All major actions are logged via AuditService:
- Template creation/updates
- Audit scheduling, starting, completion
- Finding reports
- Corrective action assignments & status changes

Entity types: `STORE_AUDIT`, `AUDIT_FINDING`, `CORRECTIVE_ACTION`
Actions: `CREATED`, `UPDATED`, `STATUS_CHANGED`, `COMPLETED`, `ASSIGNED`

## Usage Example

### 1. Create Template (HQ)
```typescript
POST /store-audits/templates
{
  "name": "Monthly Store Inspection",
  "description": "Standard monthly checklist",
  "sections": [
    {
      "order": 0,
      "title": "Store Cleanliness",
      "weight": 2.0,
      "questions": [
        {
          "order": 0,
          "text": "Are floors clean and free of debris?",
          "questionType": "YES_NO",
          "maxScore": 10,
          "requiresPhoto": true
        },
        {
          "order": 1,
          "text": "Rate overall cleanliness (0-10)",
          "questionType": "SCORE",
          "maxScore": 10
        }
      ]
    }
  ]
}
```

### 2. Schedule Audit (HQ/Regional)
```typescript
POST /store-audits/schedule
{
  "templateId": "uuid",
  "storeId": "uuid",
  "scheduledDate": "2026-03-15",
  "auditorId": "uuid"  // optional, defaults to current user
}
```

### 3. Conduct Audit (Auditor)
```typescript
// Start
POST /store-audits/{auditId}/start

// Answer questions
POST /store-audits/{auditId}/answer
{
  "questionId": "uuid",
  "score": 8,
  "photoUrls": ["https://..."],
  "notes": "Minor issue in corner"
}

// Report finding
POST /store-audits/{auditId}/finding
{
  "sectionId": "uuid",
  "severity": "MEDIUM",
  "title": "Floor damage in aisle 3",
  "description": "Cracked tiles need replacement",
  "photoUrls": ["https://..."]
}

// Complete
POST /store-audits/{auditId}/complete
```

### 4. Corrective Action (Manager/HQ)
```typescript
// Create action
POST /store-audits/findings/{findingId}/corrective-action
{
  "assignedToId": "uuid",
  "dueDate": "2026-03-20",
  "description": "Replace cracked tiles in aisle 3"
}

// Update status (Assignee)
PATCH /store-audits/corrective-actions/{actionId}
{
  "status": "IN_PROGRESS"
}

// Mark complete (Assignee)
PATCH /store-audits/corrective-actions/{actionId}
{
  "status": "COMPLETED",
  "completionNotes": "Tiles replaced",
  "completionPhotoUrls": ["https://..."]
}

// Verify (HQ)
PATCH /store-audits/corrective-actions/{actionId}
{
  "status": "VERIFIED"
}
```

### 5. Dashboard (All roles)
```typescript
GET /store-audits/dashboard?storeId={uuid}&dateFrom=2026-01-01&dateTo=2026-03-31

Response:
{
  "totalAudits": 45,
  "completedAudits": 40,
  "scheduledAudits": 3,
  "inProgressAudits": 2,
  "averageScore": 87.5,
  "openFindings": 12,
  "criticalFindings": 2,
  "overdueActions": 3,
  "scoresByStore": [...]
}
```

## Integration

Add to main `app.module.ts`:
```typescript
import { StoreAuditsModule } from './modules/store-audits/store-audits.module';

@Module({
  imports: [
    // ... other modules
    StoreAuditsModule,
  ],
})
export class AppModule {}
```

## Database Schema

Requires the following Prisma models (already in schema):
- `AuditTemplate`
- `AuditSection`
- `AuditQuestion`
- `StoreAudit`
- `AuditAnswer`
- `AuditFinding`
- `CorrectiveAction`

Enums:
- `QuestionType`: SCORE, YES_NO, TEXT
- `AuditVisitStatus`: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- `FindingSeverity`: LOW, MEDIUM, HIGH, CRITICAL
- `FindingStatus`: OPEN, ACTION_ASSIGNED, IN_PROGRESS, RESOLVED, VERIFIED
- `CorrectiveActionStatus`: PENDING, IN_PROGRESS, COMPLETED, OVERDUE, VERIFIED

## Dependencies

- `PrismaModule` - Database access
- `EventsModule` - WebSocket notifications
- `AuditModule` - Activity logging
- `@nestjs/swagger` - API documentation
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation
