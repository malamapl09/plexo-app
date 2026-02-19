# Plexo Operations

Sistema de gestión de operaciones de tiendas para Plexo - República Dominicana.

## Estructura del Proyecto

```
operations-app/
├── apps/
│   ├── api/          # NestJS Backend API
│   ├── mobile/       # Flutter Mobile App
│   └── web/          # Next.js Web Dashboard
└── packages/
    └── database/     # Prisma Schema
```

## Módulos

1. **Plan del Día (Tareas)** - Gestión de tareas diarias HQ → Tiendas
2. **Recepciones** - Documentación digital de entregas con escaneo de códigos, firma digital, fotos
3. **Incidencias** - Sistema de tickets con auto-asignación y escalamiento
4. **Verificaciones** - Verificación de tareas completadas
5. **Checklists / SOPs** - Listas de verificación diarias/semanales con scoring
6. **Auditorías** - Inspecciones de tienda con secciones, scoring ponderado, hallazgos
7. **Acciones Correctivas (CAPA)** - Auto-creadas desde auditorías, checklists, e incidencias
8. **Planogramas** - Merchandising visual: HQ publica referencia, tiendas envían fotos, HQ aprueba
9. **Comunicaciones** - Anuncios HQ → Tiendas con confirmación de lectura
10. **Gamificación** - Puntos, insignias, y clasificaciones por tienda/región
11. **Permisos** - Control de acceso por módulo/rol configurable por super admin

## Tech Stack

| Componente | Tecnología |
|------------|------------|
| Mobile | Flutter + Riverpod + Drift |
| Web | Next.js 14 + TailwindCSS |
| API | NestJS + TypeScript |
| Database | PostgreSQL + Prisma |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| Push | Firebase Cloud Messaging |

## Requisitos Previos

- Node.js 20+
- Flutter 3.16+
- PostgreSQL 16
- Redis
- MinIO

## Inicio Rápido (macOS)

### 1. Instalar Servicios con Homebrew

```bash
# PostgreSQL 16
brew install postgresql@16
brew services start postgresql@16

# Redis
brew install redis
brew services start redis

# MinIO
brew install minio/stable/minio
mkdir -p ~/minio-data
MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin minio server ~/minio-data --console-address :9001 &

# MinIO Client (para crear buckets)
brew install minio/stable/mc
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/photos local/signatures local/documents --ignore-existing
mc anonymous set download local/photos local/signatures local/documents
```

### 2. Configurar Base de Datos

```bash
# Crear usuario y base de datos
/opt/homebrew/opt/postgresql@16/bin/createuser -s plexo
/opt/homebrew/opt/postgresql@16/bin/psql -c "ALTER USER plexo WITH PASSWORD 'plexo_dev_2024';" postgres
/opt/homebrew/opt/postgresql@16/bin/createdb -O plexo operations
```

### 3. Instalar Dependencias

```bash
cd operations-app

# Backend
cd apps/api && npm install

# Web
cd ../web && npm install

# Flutter
cd ../mobile && flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### 4. Configurar API

```bash
cd apps/api

# El archivo .env ya está configurado para desarrollo local
# Verificar que tenga:
# DATABASE_URL="postgresql://plexo:plexo_dev_2024@localhost:5432/operations?schema=public"
# MINIO_ACCESS_KEY="minioadmin"
# MINIO_SECRET_KEY="minioadmin"

# Ejecutar migraciones
npx prisma generate
npx prisma migrate deploy
```

### 5. Iniciar Aplicaciones

```bash
# Terminal 1 - API
cd apps/api && npm run start:dev

# Terminal 2 - Web
cd apps/web && npm run dev

# Terminal 3 - Mobile (iOS Simulator)
cd apps/mobile
open -a Simulator
flutter run
```

### 6. Detener Servicios

```bash
brew services stop postgresql@16
brew services stop redis
pkill minio
```

## URLs de Desarrollo

| Servicio | URL |
|----------|-----|
| API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/api/docs |
| Web Dashboard | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |

## Credenciales de Prueba

Password para todos: `admin123`

| Rol | Email | Tienda |
|-----|-------|--------|
| Operations Manager | admin@plexo.com.do | HQ (acceso total) |
| HQ Team | operaciones@plexo.com.do | HQ |
| Regional Supervisor | supervisor.sd@plexo.com.do | Santo Domingo |
| Store Manager | gerente.duarte@plexo.com.do | PL01 - Plexo Duarte 78 |
| Dept Supervisor | supervisor.electro@plexo.com.do | PL01 - Electrodomésticos |

## Estructura de la API

Ver documentación completa en [docs/API.md](docs/API.md)

```
# Autenticación
POST   /api/v1/auth/login          # Iniciar sesión (retorna moduleAccess + isSuperAdmin)
POST   /api/v1/auth/refresh        # Actualizar token
GET    /api/v1/auth/profile        # Perfil del usuario actual
POST   /api/v1/auth/logout         # Cerrar sesión

# Permisos de Módulos
GET    /api/v1/module-access/my-modules   # Módulos accesibles del usuario
GET    /api/v1/module-access/grid         # Grilla completa (super admin)
PATCH  /api/v1/module-access/:role        # Actualizar permisos de un rol (super admin)

# Usuarios, Tiendas, Tareas, Recepciones, Incidencias
# (ver docs/API.md para listado completo)

# Checklists
GET    /api/v1/checklists              # Listar plantillas
POST   /api/v1/checklists              # Crear plantilla
POST   /api/v1/checklists/:id/submit   # Iniciar submission
GET    /api/v1/checklists/dashboard     # Dashboard de cumplimiento

# Auditorías
GET    /api/v1/store-audits            # Listar auditorías
POST   /api/v1/store-audits/schedule   # Agendar auditoría
POST   /api/v1/store-audits/:id/start  # Iniciar auditoría
POST   /api/v1/store-audits/:id/complete # Completar auditoría

# Acciones Correctivas (CAPA)
GET    /api/v1/corrective-actions      # Listar acciones
POST   /api/v1/corrective-actions      # Crear acción
GET    /api/v1/corrective-actions/dashboard # Dashboard CAPA

# Planogramas
GET    /api/v1/planograms/templates    # Listar plantillas
POST   /api/v1/planograms/templates/:id/submit  # Enviar fotos
POST   /api/v1/planograms/submissions/:id/review # Aprobar/revisar

# Gamificación
GET    /api/v1/gamification/leaderboard    # Clasificación
GET    /api/v1/gamification/badges         # Insignias
GET    /api/v1/gamification/my-profile     # Mi perfil gamificación
```

## Desarrollo

### Backend (NestJS)

```bash
cd apps/api
npm run start:dev    # Desarrollo con hot-reload
npm run test         # Tests
npm run lint         # Linting
```

### Web (Next.js)

```bash
cd apps/web
npm run dev          # Desarrollo
npm run build        # Build producción
npm run lint         # Linting
```

### Mobile (Flutter)

```bash
cd apps/mobile
flutter run          # Desarrollo
flutter build apk    # Build Android
flutter build ios    # Build iOS
```

### Base de Datos

```bash
cd apps/api
npx prisma studio    # GUI para explorar datos
npx prisma migrate dev --name descripcion  # Nueva migración
npx prisma generate  # Regenerar cliente
```

## Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgresql://plexo:plexo_dev_2024@localhost:5432/operations` |
| `REDIS_HOST` | Host de Redis | `localhost` |
| `REDIS_PORT` | Puerto de Redis | `6379` |
| `MINIO_ENDPOINT` | Endpoint de MinIO | `localhost` |
| `MINIO_PORT` | Puerto de MinIO | `9000` |
| `MINIO_ACCESS_KEY` | Usuario MinIO | `minioadmin` |
| `MINIO_SECRET_KEY` | Password MinIO | `minioadmin` |
| `JWT_SECRET` | Secreto para tokens JWT | (ver .env) |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | (ver .env) |

## Documentación

- [API Documentation](docs/API.md) - Endpoints, request/response formats, status flows
- [Web Dashboard](docs/WEB.md) - Next.js admin app, pages, navigation
- [Mobile App](docs/MOBILE.md) - Flutter app, features, offline support
- [CI/CD Setup](docs/GITLAB_CI_SETUP.md) - GitLab CI/CD (outdated — Docker removed)

---

Plexo © 2025
