# Vestly — Investment Dashboard

A full-stack investment portfolio tracker. Track wallets, transactions, notes, and statistics across stocks, ETFs, crypto, bonds, and more.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| State | React Context (AuthContext, PortfolioContext) |
| HTTP | Axios with silent JWT refresh interceptor |
| Backend | Node.js + Express + TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Auth | JWT — access token (15m) + refresh token (7d, httpOnly cookie, rotated) |
| Infra | Docker + Docker Compose |
| Monorepo | pnpm workspaces |

## Project structure

```
vestly/
├── apps/
│   ├── api/                  # Express API
│   │   ├── src/
│   │   │   ├── db/           # Drizzle schema, migrations, client
│   │   │   ├── services/     # Business logic
│   │   │   ├── controllers/  # Route handlers
│   │   │   ├── routes/       # Express routers
│   │   │   ├── middleware/   # requireAuth
│   │   │   └── utils/        # JWT helpers, response helpers
│   │   └── Dockerfile
│   └── web/                  # React + Vite frontend
│       ├── src/
│       │   ├── api/          # Axios client + service calls
│       │   ├── contexts/     # AuthContext, PortfolioContext
│       │   ├── pages/        # Dashboard, Wallets, Transactions, Notes, Auth
│       │   └── components/   # AppLayout
│       └── Dockerfile
└── packages/
    └── shared/               # Shared TypeScript types and DTOs
```

## Quick start (local dev)

### 1. Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set strong JWT secrets
```

### 5. Run migrations

```bash
pnpm db:migrate
```

### 6. Start dev servers

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000
- Health check: http://localhost:4000/health

## Production (Docker)

```bash
# Build and start everything
docker compose up --build -d

# Run migrations against the production DB
docker compose exec api node dist/db/migrate.js
```

## Database migrations

```bash
# Generate migration files after schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Open Drizzle Studio (DB browser)
pnpm db:studio
```

## API endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh access token (uses httpOnly cookie) |
| POST | /api/auth/logout | Logout + revoke refresh token |

### Wallets
| Method | Path | Description |
|---|---|---|
| GET | /api/wallets | List user's wallets |
| GET | /api/wallets/:id | Get wallet |
| POST | /api/wallets | Create wallet |
| PATCH | /api/wallets/:id | Update wallet |
| DELETE | /api/wallets/:id | Delete wallet |

### Transactions
| Method | Path | Description |
|---|---|---|
| GET | /api/transactions/wallet/:walletId | List transactions for wallet |
| POST | /api/transactions | Add transaction |
| DELETE | /api/transactions/:id | Delete transaction |

### Notes
| Method | Path | Description |
|---|---|---|
| GET | /api/notes | List notes |
| GET | /api/notes/:id | Get note |
| POST | /api/notes | Create note |
| PATCH | /api/notes/:id | Update note |
| DELETE | /api/notes/:id | Delete note |

### Stats
| Method | Path | Description |
|---|---|---|
| GET | /api/stats | Portfolio stats (ROI, allocation, quarterly results) |

## Auth flow

```
Login → POST /api/auth/login
  → access token (15m) returned in JSON body (stored in memory only)
  → refresh token (7d) set as httpOnly cookie

API request → Bearer {accessToken} in Authorization header

401 received → axios interceptor calls POST /api/auth/refresh
  → new access token returned, refresh token rotated
  → original request retried automatically

Logout → POST /api/auth/logout
  → refresh token revoked in DB
  → cookie cleared
  → access token dropped from memory
```

## Environment variables

### apps/api/.env

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://vestly:vestly_secret@localhost:5432/vestly_db
JWT_ACCESS_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars, different from access>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

### apps/web/.env

```env
VITE_API_URL=http://localhost:4000
```
