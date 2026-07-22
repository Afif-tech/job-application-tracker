# Job Application Platform — API

REST API for the Job Application Sharing Platform. Node.js · Express · MySQL · Sequelize · JWT.

## Prerequisites

- Node.js 18+
- MySQL 8 running locally

## Setup

```bash
npm install
cp .env.example .env        # then edit DB credentials + secrets
# create the database (once):
#   mysql -u root -p -e "CREATE DATABASE job_application CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run migrate
npm run dev                 # http://localhost:4000
```

## Environment (`.env`)

| Var | Description |
| --- | --- |
| `PORT` | API port (default 4000) |
| `CORS_ORIGINS` | Comma-separated allowed origins (default `http://localhost:5173`) |
| `DB_*` | MySQL host/port/name/user/password |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Signing secrets — change in production |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | Token lifetimes (e.g. `15m`, `7d`) |
| `UPLOAD_MAX_BYTES` | Max resume upload size (default 5 MB) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Cloudflare R2 (S3-compatible) object storage. Leave all blank to store uploads on local disk (dev). Set all four in production so resumes survive redeploys on ephemeral hosts. |

## File storage

Uploads use a pluggable storage driver (`src/config/storage.js`): **local disk** when the `R2_*`
vars are unset, **Cloudflare R2** when they are all set. The app only stores an opaque storage key
in `stored_path`, so switching backends needs no code or schema changes. Downloads are streamed
through the auth-checked `/api/resumes/:id/download` route in both modes.

### Creating an R2 bucket (free tier)

1. Cloudflare dashboard → **R2** → create a bucket (e.g. `job-app-resumes`).
2. **R2 → Manage API Tokens** → create a token with Object Read & Write for that bucket.
3. Put the Account ID, Access Key ID, Secret Access Key, and bucket name into the `R2_*` env vars.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start with nodemon |
| `npm start` | Start (production) |
| `npm run migrate` | Run migrations |
| `npm run migrate:undo` | Roll back last migration |
| `npm run seed` | Run seeders (demo data) |
| `npm run seed:undo` | Remove seeded demo data |
| `npm test` | Run Jest tests |

## Demo data

`npm run seed` creates three demo accounts (password **`password123`**) and a shared
job list "Frontend Roles 2027" with jobs and independent per-user statuses:

| Email | Role in demo list |
| --- | --- |
| `alice@demo.test` | Owner |
| `bob@demo.test` | Member |
| `carol@demo.test` | Member |

The seeder is idempotent — re-running it refreshes the demo rows.

## Response envelope

```jsonc
// success
{ "success": true, "data": { }, "message": "optional", "meta": { } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

## Endpoints (Phase 1)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Liveness check |
| POST | `/api/auth/register` | – | Create account, returns token pair |
| POST | `/api/auth/login` | – | Log in, returns token pair |
| POST | `/api/auth/refresh` | – | Rotate refresh token, new pair |
| POST | `/api/auth/logout` | – | Revoke a refresh token |
| GET | `/api/me` | Bearer | Current user |
| PUT | `/api/me` | Bearer | Update profile |

Later phases add job-lists, members, jobs, resumes, status, and dashboard routes.

## Architecture

`routes → middlewares (auth, validate) → controllers → services (transactions) → models`.
See the project plan for the full roadmap. Public identifiers are UUIDs; soft deletes via
`deleted_at`; refresh tokens are stored hashed with rotation + reuse detection.
