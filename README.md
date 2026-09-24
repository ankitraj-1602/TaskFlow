# TaskFlow

![CI](https://github.com/ankitraj-1602/TaskFlow/actions/workflows/ci.yml/badge.svg)
![Tests](https://img.shields.io/badge/tests-121%20passing-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

A production-style multi-tenant project management SaaS with authentication, RBAC, real-time collaboration, caching, background jobs, multi-session support, and CI/CD.

**Live Demo:** https://task-flow-tau-amber.vercel.app  
**API:** https://taskflow-backend-production-0006.up.railway.app  
**Health Check:** https://taskflow-backend-production-0006.up.railway.app/health

---

## Features

### Authentication
- JWT access + refresh tokens
- Email verification
- Forgot / reset password
- **Multi-device session management** — see and revoke active sessions per device
- Logout all devices
- Account deletion with soft-delete

### Workspaces
- Multi-tenant with roles: OWNER, ADMIN, MANAGER, MEMBER, VIEWER
- Member invitations via email
- Ownership protection

### Projects
- CRUD with archive/unarchive
- Project-level member overrides
- Progress tracking

### Tasks
- Full CRUD with priority, status, due date, story points
- Kanban board with drag-and-drop (dnd-kit)
- Position-based reordering
- Filters + My Tasks pagination
- Duplicate, archive, restore

### Labels / Tags
- Per-project custom labels
- Color-coded badges
- Attach multiple labels to a task
- Filter tasks by label
- Real-time sync across users

### Collaboration
- Task comments with nested replies
- @mentions with autocomplete
- Activity log (auto audit trail)
- Real-time notifications via Socket.IO

### Notifications
- In-app bell with unread badge
- Real-time delivery
- Deep-linking to tasks
- Mark read, delete, clear all

### File Attachments
- Upload, preview, download, delete
- MIME validation + 10MB limit
- Image thumbnails

### Global Search
- PostgreSQL full-text search
- Command palette (Cmd/Ctrl + K)
- Highlighted matches

### Dashboard & Analytics
- Overview cards
- Task trends line chart
- Priority & status charts
- Team productivity table
- Project progress bars
- Overdue breakdown

### Security
- JWT with 15m access + 7d refresh tokens
- Refresh token rotation
- Per-session tracking with instant revocation
- Bcrypt password hashing
- Rate limiting per IP + user
- Helmet security headers
- CORS allowlist
- Joi input validation
- Parameterized SQL queries

### Performance
- Redis caching with automatic invalidation
- BullMQ background jobs
- Graceful degradation if Redis is down

### Engineering
- Docker + Compose
- CI/CD with GitHub Actions
- 121 Jest tests (unit + integration)
- 41% coverage, 94% on routes
- Branch protection on `main`
- Structured logging with Winston

---

## Tech Stack

**Backend:** Node.js 20, Express, PostgreSQL (raw SQL), Redis, BullMQ, Socket.IO, JWT, Bcrypt, Joi, Multer, Brevo (email), Winston (logging), Docker

**Frontend:** React 18, Vite, Tailwind CSS, Zustand, React Router, React Hook Form + Zod, Recharts, dnd-kit, Socket.IO Client, Axios

**Infrastructure:** Vercel (frontend), Railway (backend + Redis), Supabase (Postgres), Brevo (email), GitHub Actions (CI/CD)

---

## Architecture

```text
Browser
   │
   ▼
Vercel (React CDN)
   │  HTTPS + WebSocket
   ▼
Railway (Node.js + Docker)
   │
   ├──▶ Supabase (PostgreSQL)
   ├──▶ Railway Redis (cache + queues)
   └──▶ Brevo (email HTTP API)
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- PostgreSQL ≥ 14
- Redis ≥ 7
- Docker (optional)

### Clone

```bash
git clone https://github.com/ankitraj-1602/TaskFlow.git
cd TaskFlow
```

### Environment Variables

**Backend** (`backend/.env`)

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=taskflow

REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

BCRYPT_SALT_ROUNDS=10
CACHE_TTL_SECONDS=300

BREVO_API_KEY=xkeysib-your-api-key
EMAIL_FROM_EMAIL=your-verified-email@gmail.com
EMAIL_FROM_NAME=TaskFlow

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

EMAIL_VERIFICATION_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=1
```

**Frontend** (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Running Locally

```bash
# 1. Create databases
createdb taskflow
createdb taskflow_test

# 2. Start Redis
redis-server

# 3. Backend
cd backend
npm install
node src/db/migrate.js
npm run dev

# 4. Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

Verify the backend:

```bash
curl http://localhost:5000/health
```

### Running with Docker

```bash
docker-compose up --build
```

Services started:

| Service  | Port |
|----------|------|
| postgres | 5432 |
| redis    | 6379 |
| backend  | 5000 |
| frontend | 5173 |

Stop:

```bash
docker-compose down

# Fresh DB (removes volumes)
docker-compose down -v
```

---

## Database

### Migrations

SQL files live in `backend/src/db/migrations/`. Run them with:

```bash
node src/db/migrate.js
```

### Tables

- `users`
- `email_verification_tokens`
- `password_reset_tokens`
- `sessions` (multi-device tracking)
- `workspaces`
- `workspace_members`
- `workspace_invitations`
- `projects`
- `project_members`
- `tasks`
- `comments`
- `mentions`
- `attachments`
- `activity_logs`
- `notifications`
- `labels`
- `task_labels`

---

## Testing

```bash
cd backend

npm test              # run all tests
npm run test:coverage # with coverage
npm run test:watch    # watch mode
```

### Test Suites

| Suite             | Count | Type        |
|-------------------|-------|-------------|
| password.utils    | 10    | Unit        |
| user.service      | 19    | Unit        |
| task.service      | ~30   | Unit        |
| workspace.service | ~40   | Unit        |
| health            | 1     | Integration |
| auth              | 12    | Integration |
| tasks             | 14    | Integration |
| rbac              | 11    | Integration |
| **Total**         | **121** |           |

### Coverage

- Overall: ~41% statements
- Routes: 94.82%
- Validators: 100%
- Middleware: 64%
- Services: 43.5%

---

## CI/CD

### GitHub Actions

File: `.github/workflows/ci.yml`

**Triggers:**
- Push to `JestTesting` or `main`
- PRs targeting `main`
- Manual trigger

**Pipeline:**
1. Checkout code
2. Set up Node.js 20
3. Start Postgres 16 + Redis 7 containers
4. `npm ci`
5. Run migrations
6. Run ESLint
7. Run 121 Jest tests
8. Upload coverage

Duration: ~2 minutes

### Branch Protection

`main` is protected:
- Requires a PR
- Requires the `CI / Lint & Test` check
- Requires branches to be up to date

### Deploy Flow

```text
Push to JestTesting → CI ✅ → Open PR → CI ✅ → Merge → Auto-deploy
```

---

## Deployment

### Production Stack

| Layer    | Service       |
|----------|---------------|
| Frontend | Vercel        |
| Backend  | Railway (Docker) |
| Database | Supabase      |
| Cache    | Railway Redis |
| Email    | Brevo         |

### Vercel (frontend)

1. Connect the GitHub repo
2. Root Directory: `frontend`
3. Env: `VITE_API_URL=https://taskflow-backend-production-0006.up.railway.app`

### Railway (backend + Redis)

1. Connect the GitHub repo
2. Create a Web Service from the `backend` folder
3. Railway auto-detects the Dockerfile
4. Add a Redis plugin — Railway auto-injects `REDIS_URL`
5. Set all other `.env` vars as environment variables
6. Health check path: `/health`
7. Railway auto-deploys on every push to `main`

**Why Railway over other platforms:**
- Native Docker support with auto-detection
- Built-in Redis addon — one click to add, auto-injected env vars
- No cold-start / sleeping
- Automatic HTTPS + custom domains
- Real-time logs and metrics built into the dashboard
- One environment for both backend and Redis — simpler mental model

### Supabase (database)

1. Create a project
2. Use the pooler connection string (IPv4)
3. Run migrations

### Brevo (email)

1. Create a Brevo account
2. Verify a sender email
3. Generate an API key
4. Set `BREVO_API_KEY`, `EMAIL_FROM_EMAIL`, `EMAIL_FROM_NAME`

---

## API Reference

**Base URL:** `http://localhost:5000/api` (or production)

**Auth header:** `Authorization: Bearer <access_token>`

### Auth

| Method | Endpoint |
|--------|----------|
| POST   | `/auth/register` |
| POST   | `/auth/login` |
| POST   | `/auth/refresh` |
| POST   | `/auth/logout` |
| POST   | `/auth/logout-all` |
| POST   | `/auth/verify-email` |
| POST   | `/auth/resend-verification` |
| POST   | `/auth/forgot-password` |
| POST   | `/auth/reset-password` |
| GET    | `/auth/profile` |
| PATCH  | `/auth/profile` |
| PATCH  | `/auth/password` |
| DELETE | `/auth/account` |
| GET    | `/auth/sessions` |
| DELETE | `/auth/sessions/:id` |

### Workspaces

| Method | Endpoint |
|--------|----------|
| GET    | `/workspaces` |
| POST   | `/workspaces` |
| GET    | `/workspaces/:id` |
| PATCH  | `/workspaces/:id` |
| DELETE | `/workspaces/:id` |
| GET    | `/workspaces/:id/members` |
| POST   | `/workspaces/:id/members` |
| PATCH  | `/workspaces/:id/members/:memberId` |
| DELETE | `/workspaces/:id/members/:memberId` |
| GET    | `/workspaces/:id/invitations` |
| DELETE | `/workspaces/:id/invitations/:id` |

### Projects

| Method | Endpoint |
|--------|----------|
| GET    | `/workspaces/:wid/projects` |
| POST   | `/workspaces/:wid/projects` |
| GET    | `/projects/:id` |
| PATCH  | `/projects/:id` |
| DELETE | `/projects/:id` |
| POST   | `/projects/:id/archive` |
| POST   | `/projects/:id/unarchive` |

### Tasks

| Method | Endpoint |
|--------|----------|
| GET    | `/projects/:id/tasks` |
| POST   | `/projects/:id/tasks` |
| GET    | `/tasks/:id` |
| PATCH  | `/tasks/:id` |
| PATCH  | `/tasks/:id/status` |
| DELETE | `/tasks/:id` |
| POST   | `/tasks/:id/duplicate` |
| POST   | `/tasks/:id/archive` |
| POST   | `/tasks/:id/unarchive` |
| GET    | `/my-tasks` |
| GET    | `/projects/:id/tasks/stats` |

### Labels

| Method | Endpoint |
|--------|----------|
| GET    | `/projects/:id/labels` |
| POST   | `/projects/:id/labels` |
| PATCH  | `/labels/:id` |
| DELETE | `/labels/:id` |
| POST   | `/tasks/:taskId/labels/:labelId` |
| DELETE | `/tasks/:taskId/labels/:labelId` |

### Comments

| Method | Endpoint |
|--------|----------|
| GET    | `/tasks/:id/comments` |
| POST   | `/tasks/:id/comments` |
| PATCH  | `/comments/:id` |
| DELETE | `/comments/:id` |

### Notifications

| Method | Endpoint |
|--------|----------|
| GET    | `/notifications` |
| GET    | `/notifications/unread-count` |
| PATCH  | `/notifications/:id/read` |
| PATCH  | `/notifications/read-all` |
| DELETE | `/notifications/:id` |
| DELETE | `/notifications` |

### Dashboard

| Method | Endpoint |
|--------|----------|
| GET    | `/workspaces/:id/dashboard` |
| GET    | `/workspaces/:id/dashboard/trends` |
| GET    | `/workspaces/:id/dashboard/team` |
| GET    | `/workspaces/:id/dashboard/projects` |
| GET    | `/workspaces/:id/dashboard/overdue` |

### Search & Attachments

| Method | Endpoint |
|--------|----------|
| GET    | `/search?q=query` |
| GET    | `/tasks/:id/attachments` |
| POST   | `/tasks/:id/attachments` |
| DELETE | `/attachments/:id` |
| GET    | `/uploads/:year/:month/:filename` |

### Health

| Method | Endpoint |
|--------|----------|
| GET    | `/health` |
| GET    | `/health/detailed` |

---

## Project Structure

```text
TaskFlow/
├── .github/workflows/ci.yml
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── index.js
│   │   ├── config/           # DB, Redis, queues, socket, upload, logger
│   │   ├── controllers/      # HTTP layer
│   │   ├── services/         # Business logic
│   │   ├── routes/           # Express routers
│   │   ├── middleware/       # Auth, RBAC, validation, logger
│   │   ├── db/
│   │   │   ├── migrations/   # SQL migrations
│   │   │   ├── migrate.js
│   │   │   └── queries/      # Raw SQL
│   │   ├── workers/          # BullMQ workers
│   │   ├── jobs/             # Producers + scheduler
│   │   ├── utils/            # JWT, password, cache, tokens
│   │   └── __tests__/        # Jest tests
│   ├── jest.config.js
│   ├── eslint.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Key Engineering Decisions

- **Raw SQL over ORM** — full query control, explicit joins, no N+1 surprises
- **Service + Controller + Query pattern** — clear separation, testable layers
- **Redis caching with invalidation** — dashboard went from 400ms → 20ms
- **`cacheWrapper` pattern** — single helper, graceful degradation if Redis is down
- **BullMQ for emails** — API responses stay instant (~50ms)
- **Socket.IO for real-time** — `emitToUser` + `emitToWorkspace`
- **Multi-tenant via `workspace_members`** — RBAC in middleware + services
- **Position-based ordering** — Kanban reorder is a single UPDATE
- **Soft deletes with email masking** — preserves audit trail, frees the email
- **Brevo HTTP API over SMTP** — some hosts block SMTP on free tiers
- **Per-session tracking** — every login creates a session row, `sessionId` is embedded in the JWT and checked on every request
- **Instant session revocation** — delete the session row → middleware rejects the next request
- **Winston structured logging** — correlation IDs, JSON in production, graceful levels

---

## Performance & Caching

### Cache Keys

| Key                            | TTL  |
|--------------------------------|------|
| `user:<id>:auth`               | 300s |
| `user:<id>:workspaces`         | 120s |
| `session:<id>:active`          | 30s  |
| `workspace:<id>:access:<uid>`  | 60s  |
| `workspace:<id>:role:<uid>`    | 60s  |
| `workspace:<id>:members`       | 60s  |
| `dashboard:*:<workspaceId>`    | 60s  |
| `mytasks:<uid>:*`              | 30s  |

### Before vs After

| Endpoint                       | Before | After     |
|--------------------------------|--------|-----------|
| `/workspaces`                  | ~500ms | ~20ms     |
| `/dashboard`                   | ~400ms | ~15–30ms  |
| `/notifications/unread-count`  | ~130ms | ~30ms     |

---

## Security

- JWT with 15m access + 7d refresh tokens
- Refresh token rotation on every use
- Per-device session tracking with instant revocation
- Bcrypt password hashing
- Helmet security headers
- CORS allowlist
- Rate limiting per IP + user
- Joi input validation
- Parameterized SQL queries
- MIME type + size validation
- RBAC middleware + service checks
- Soft delete with email masking
- Single-use tokens for verify/reset
- Trust proxy for real client IPs

---

## Roadmap

### Done
- [x] Auth, workspaces, projects, tasks
- [x] Kanban board
- [x] Comments with @mentions
- [x] Activity log
- [x] Real-time notifications
- [x] File attachments
- [x] Global search
- [x] Dashboard + analytics
- [x] Redis caching
- [x] BullMQ jobs
- [x] Docker + Compose
- [x] Full deployment
- [x] Jest testing (121 tests)
- [x] CI/CD with GitHub Actions
- [x] Task labels/tags
- [x] Winston logging
- [x] Multi-device session management
- [x] Mobile-responsive sidebar

### Planned
- [ ] Playwright E2E tests
- [ ] Swagger API docs
- [ ] Dark mode
- [ ] Demo video

---

## License

MIT

## Contact

**Ankit Raj**  
GitHub: [@ankitraj-1602](https://github.com/ankitraj-1602)