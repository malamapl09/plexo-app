# Plexo Operations - Web Dashboard Documentation

Next.js 14 admin dashboard for HQ, regional management, and platform administration.

## Requirements

- Node.js 20+
- API running on port 3001 (local dev) or accessible at `NEXT_PUBLIC_API_URL`

## Production

Live at **https://app.plexoapp.com**. The web app runs as a standalone Next.js container behind Caddy (auto-TLS). API calls from the browser go directly to `https://api.plexoapp.com` via `NEXT_PUBLIC_API_URL`.

## Getting Started

```bash
cd apps/web
npm install
npm run dev     # http://localhost:3000
```

### Environment Variables

Create `.env.local` or set in environment:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_NAME` | App display name | `Plexo` |
| `NEXT_PUBLIC_APP_LOGO` | Logo path | `/logo.svg` |

## Tech Stack

| Library | Purpose |
|---------|---------|
| Next.js 14 | App Router, SSR, file-based routing |
| Tailwind CSS 3.4 | Styling |
| React Query (TanStack) | Server state, caching, auto-invalidation |
| Zustand | Client state |
| React Hook Form + Zod | Form handling and validation |
| Radix UI | Accessible primitives (Dialog, Select, Tabs, etc.) |
| Recharts | Charts and analytics |
| Socket.io Client | Real-time WebSocket events |
| date-fns | Date formatting |

## Project Structure

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              # Login page
│   │   ├── forgot-password/page.tsx    # Forgot password
│   │   ├── reset-password/page.tsx     # Reset password (token from email)
│   │   └── accept-invite/page.tsx      # Accept invitation (set name + password)
│   ├── platform/
│   │   ├── layout.tsx                  # Platform admin layout + guard (5-item sidebar)
│   │   ├── page.tsx                    # Platform dashboard (7 stats + alerts count)
│   │   ├── health/page.tsx             # Organization health dashboard (P1)
│   │   ├── alerts/page.tsx             # Platform alerts — inactive, low adoption, upsell (P4)
│   │   ├── benchmarks/page.tsx         # Cross-org benchmarking table (P5)
│   │   └── organizations/
│   │       ├── page.tsx                # Organization list
│   │       ├── new/page.tsx            # Create organization
│   │       └── [id]/
│   │           ├── page.tsx            # Organization detail + edit
│   │           ├── activity/page.tsx   # Org activity timeline — bar chart, logins, logs (P3)
│   │           └── audit-logs/page.tsx # Paginated audit log viewer with filters (P6)
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Sidebar + route protection
│   │   ├── tasks/                      # Task management
│   │   │   ├── page.tsx                # Task list
│   │   │   └── templates/page.tsx      # Task templates
│   │   ├── checklists/                 # Checklist management
│   │   │   ├── page.tsx                # Template list
│   │   │   ├── [id]/page.tsx           # Template detail
│   │   │   └── submissions/            # Submission list + detail
│   │   ├── store-audits/               # Audit management
│   │   │   ├── page.tsx                # Audit list
│   │   │   ├── [id]/page.tsx           # Audit detail
│   │   │   └── templates/              # Audit templates
│   │   ├── corrective-actions/         # CAPA management
│   │   │   ├── page.tsx                # Action list + dashboard
│   │   │   └── [id]/page.tsx           # Action detail
│   │   ├── planograms/                 # Planogram management
│   │   │   ├── page.tsx                # Overview
│   │   │   ├── templates/              # Template CRUD
│   │   │   └── submissions/            # Submission review
│   │   ├── receiving/page.tsx          # Receiving list + dashboard
│   │   ├── issues/page.tsx             # Issues list + dashboard
│   │   ├── verification/page.tsx       # Verification queue
│   │   ├── communications/             # Announcements
│   │   │   ├── page.tsx                # List
│   │   │   ├── new/page.tsx            # Create announcement
│   │   │   └── [id]/page.tsx           # Detail + read receipts
│   │   ├── training/                   # Training / LMS
│   │   │   ├── page.tsx                # Course list + filters
│   │   │   ├── create/page.tsx         # Create new course
│   │   │   └── [id]/page.tsx           # Course detail + enrollment + compliance
│   │   ├── gamification/               # Gamification
│   │   │   ├── page.tsx                # Leaderboard
│   │   │   ├── badges/page.tsx         # Badge management
│   │   │   └── config/page.tsx         # Point configuration
│   │   ├── reports/page.tsx            # Reports dashboard
│   │   ├── stores/page.tsx             # Store management
│   │   ├── users/page.tsx              # User management
│   │   └── settings/
│   │       └── permissions/page.tsx    # Module permissions (super admin)
│   └── page.tsx                        # Root redirect
├── hooks/
│   └── useWebSocket.ts                 # WebSocket auto-invalidation hook
├── lib/
│   ├── layout/                         # Layout components
│   ├── ui/                             # UI primitives
│   └── socket.ts                       # Socket.io client singleton
└── components/                         # (in lib/)
```

## Authentication

Auth state is stored in `localStorage`:
- `accessToken` — JWT Bearer token
- `refreshToken` — for token refresh
- `user` — JSON with `id`, `email`, `name`, `role`, `isSuperAdmin`, `isPlatformAdmin`, `organizationId`, `moduleAccess[]`, `storeId`, `storeName`

### Login Redirect
After successful login:
- **Platform admins** (`isPlatformAdmin: true`) → redirected to `/platform/organizations`
- **All other users** → redirected to `/tasks`

### Dashboard Guard
The dashboard layout (`(dashboard)/layout.tsx`) checks auth on mount:
1. If no `accessToken` → redirect to `/login`
2. If `user` JSON is malformed → clear localStorage, redirect to `/login`
3. If `isPlatformAdmin` → redirect to `/platform/organizations` (platform admins cannot access tenant pages)
4. Otherwise → render the tenant dashboard

### Platform Guard
The platform layout (`platform/layout.tsx`) checks auth on mount:
1. If no `accessToken` → redirect to `/login`
2. If NOT `isPlatformAdmin` → redirect to `/tasks` (regular users cannot access platform pages)

**Platform sidebar** (5 items): Organizaciones, Estadisticas (`exact` match), Salud, Alertas, Comparativa. Activity and Audit Logs are sub-pages of org detail (not top-level nav).

## Navigation & Module Access

The sidebar is defined in `layout.tsx` with a `navigation` array. Each item has a `module` key:

```typescript
const navigation = [
  { name: 'Tareas', href: '/tasks', module: 'tasks' },
  { name: 'Checklists', href: '/checklists', module: 'checklists' },
  { name: 'Auditorias', href: '/store-audits', module: 'audits' },
  // ... etc
  { name: 'Permisos', href: '/settings/permissions', module: '_admin' },
]
```

**Filtering logic:**
- Platform admins never reach this layout (redirected to `/platform/organizations` before rendering)
- Items are filtered by the user's `moduleAccess` array from login
- `isSuperAdmin` users see all items
- The `_admin` module (Permisos) is only visible to super admins
- Route protection: a `useEffect` checks the current pathname against `routeModuleMap` and redirects to `/tasks` if the user lacks access

## Permissions Admin Page

`/settings/permissions` — only accessible by super admins.

Displays a grid of 14 modules x 5 roles with toggle checkboxes. Changes are saved immediately via `PATCH /api/v1/module-access/:role`.

OPERATIONS_MANAGER column is always checked and disabled (visual only — actual access is controlled by the `isSuperAdmin` flag on the user).

## Real-Time Updates

WebSocket connection via Socket.io (`lib/socket.ts`). The `useWebSocketAutoInvalidate` hook listens for events and invalidates relevant React Query caches.

Events are broadcast to rooms: `store:{storeId}`, `hq`, `user:{userId}`.

## Pages Summary

| Route | Module | Description |
|-------|--------|-------------|
| `/login` | auth | Login page |
| `/forgot-password` | auth | Request password reset email |
| `/reset-password` | auth | Set new password (from email link) |
| `/accept-invite` | auth | Accept invitation, create account |
| `/platform` | platform | Platform admin dashboard (7 stats + alerts count + quick actions) |
| `/platform/organizations` | platform | Organization list (platform admin only) — default landing page for platform admins |
| `/platform/organizations/new` | platform | Create new organization |
| `/platform/organizations/[id]` | platform | Organization detail + edit (with "Ver Actividad" and "Ver Audit Logs" buttons) |
| `/platform/organizations/[id]/activity` | platform | Org activity timeline — daily bar chart, recent logins, recent logs (P3) |
| `/platform/organizations/[id]/audit-logs` | platform | Paginated audit log viewer with entityType/action filters (P6) |
| `/platform/health` | platform | Organization health dashboard — lastLogin, active users, module adoption, task completion (P1) |
| `/platform/alerts` | platform | Platform alerts — inactive orgs, low adoption, plan opportunities (P4) |
| `/platform/benchmarks` | platform | Cross-org benchmarking — sortable task/audit/training/gamification comparison (P5) |
| `/tasks` | tasks | Daily task assignments |
| `/tasks/templates` | tasks | Task template management |
| `/checklists` | checklists | Checklist templates |
| `/checklists/submissions` | checklists | Submission list |
| `/store-audits` | audits | Audit list with filters |
| `/store-audits/templates` | audits | Audit template management |
| `/corrective-actions` | corrective_actions | CAPA list + dashboard |
| `/planograms` | planograms | Planogram overview |
| `/planograms/templates` | planograms | Template CRUD |
| `/planograms/submissions/:id` | planograms | Submission review |
| `/campaigns` | campaigns | Campaign list + create |
| `/campaigns/[id]` | campaigns | Campaign detail + submissions |
| `/campaigns/submissions/[id]` | campaigns | Submission review |
| `/receiving` | receiving | Receiving list + dashboard |
| `/issues` | issues | Issue list + dashboard |
| `/verification` | verification | Verification queue |
| `/communications` | communications | Announcement management |
| `/training` | training | Course list with category/status filters |
| `/training/create` | training | Course creation with lessons + quizzes |
| `/training/[id]` | training | Course detail, enrollment tab, compliance tab |
| `/gamification` | gamification | Leaderboard |
| `/gamification/badges` | gamification | Badge management |
| `/gamification/config` | gamification | Point configuration |
| `/reports` | reports | Reports dashboard |
| `/stores` | stores | Store management |
| `/users` | users | User management |
| `/settings/permissions` | _admin | Module permissions grid |

## Development

```bash
npm run dev      # Development server with hot-reload
npm run build    # Production build
npm run lint     # ESLint
```

---

## Loading States

Pages use **skeleton loaders** (not full-page spinners) during data fetches:

- **Tasks** — Stat cards show pulse-animated placeholders while loading
- **Campaigns** — Table shows 5 skeleton rows; dashboard tab shows skeleton stat cards
- **Training** — Table shows 5 skeleton rows; dashboard tab shows skeleton stat cards
- **Issues** — Both `IssueStatsCards` and `CategoryStatsCards` have built-in skeleton states

Pattern for skeleton table rows:
```tsx
{loading ? <SkeletonTableRows /> : (
  <tbody>...</tbody>
)}
```

Plexo Operations Web v2.0 — Multi-tenant SaaS
