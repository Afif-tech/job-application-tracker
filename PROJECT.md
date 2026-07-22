# Job Application Sharing Platform

A collaborative platform where groups share job opportunities, upload recommended and personal
resumes per job, and each member tracks their **own** application progress independently.

This repo (`job-application-api`) is the **backend**. The Vue 3 web client lives in the sibling
`job-application-web-admin` folder.

## Repositories

| Folder | Stack | Runs on |
| --- | --- | --- |
| `job-application-api` | Node.js · Express · MySQL · Sequelize · JWT · Multer | http://localhost:4000 |
| `job-application-web-admin` | Vue 3 · Vuetify · Pinia · Vue Router · Axios · Vite | http://localhost:5173 |

## Quick start

```bash
# 1) Backend
cd job-application-api
npm install
cp .env.example .env            # set DB creds + JWT secrets
mysql -u root -p -e "CREATE DATABASE job_application CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run migrate
npm run seed                    # optional demo data (see README)
npm run dev

# 2) Frontend (new terminal)
cd job-application-web-admin
npm install
cp .env.example .env            # VITE_API_BASE_URL defaults to http://localhost:4000/api
npm run dev
```

Then open http://localhost:5173 and log in with a demo account
(`alice@demo.test` / `password123`).

## Features by phase (all implemented)

1. **Auth** — register/login/logout, JWT access + refresh with rotation & reuse detection
2. **Job Lists** — CRUD, owner assignment
3. **Members** — invite by email, owner/member roles, access scoping
4. **Jobs** — full CRUD, platform enum, owner/creator edit permissions
5. **Resumes** — shared + personal (per-user) uploads, auth-checked download, disk cleanup
6. **Application Tracking** — independent per-user status with `applied_at`
7. **Dashboard** — aggregate stats, status breakdown, recent jobs
8. **Search & Filters** — search / platform / status / added-by / has-resume

## Key design decisions

- **Dual keys**: integer PKs for fast joins + public UUIDs in all API URLs.
- **Standard envelope**: every response is `{ success, data|error }`.
- **Soft deletes** on users, lists, jobs, shared resumes.
- **Per-user isolation**: `user_job_status` and `user_job_resumes` are keyed by (job, user).
- **Secure uploads**: PDF/DOC/DOCX allowlist, size cap, randomized filenames, auth-gated
  streaming download (personal resumes are private to their owner).
- **Transactions** for multi-row writes (registration, list+owner, resume replace).

See each folder's `README.md` for details.
