# Deploy: NestJS + Render Postgres + Vercel frontend

## Architecture

- **Frontend:** Next.js in `frontend/` → deploy to **Vercel**
- **Backend:** NestJS in `backend/` → deploy to **Render Web Service**
- **Database:** **Render PostgreSQL** (not Neon)

```
yumix/
  frontend/   # Next.js (Vercel)
  backend/    # NestJS + Prisma (Render)
```

## 1. Render PostgreSQL

1. In [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**
2. Name: `yumix-db` (or match `backend/render.yaml`)
3. Copy the **External Database URL** (for local) and note the **Internal Database URL** (for the web service)

## 2. Render Web Service (API)

### Option A — Blueprint

- Use [`backend/render.yaml`](backend/render.yaml)
- Set **Root Directory** to `backend`
- Set `CORS_ORIGIN` to `https://www.yumix.ge` (comma-separated if you add more origins)

### Option B — Manual

1. **New Web Service** → connect this GitHub repo
2. **Root Directory:** `backend`
3. **Build:** `npm install && npx prisma generate && npm run build`
4. **Start:** `npx prisma db push && node dist/main.js`
5. Env vars:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Render Postgres connection string (Internal URL preferred) |
| `JWT_SECRET` | long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | `https://www.yumix.ge` (add `http://localhost:3000` for local frontend → prod API tests) |
| `NODE_ENV` | `production` |

6. After first deploy, open `https://<your-api>.onrender.com/health` — expect `{ "ok": true }`

## 3. Vercel (frontend)

1. Import the same repo; **Root Directory** = `frontend`
2. Add custom domain **`www.yumix.ge`** in Vercel → Project → Settings → Domains
3. Env vars:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://<your-api>.onrender.com` |
| `API_URL` | same as above (server-side fetches) |
| `UPLOADTHING_TOKEN` | from UploadThing |
| `UPLOADTHING_SECRET` | from UploadThing |
| `UPLOADTHING_APP_ID` | from UploadThing |

3. Do **not** set `DATABASE_URL` or Neon vars on Vercel.

## 4. Local development

```bash
# Terminal 1 — API (port 3001)
cd backend
cp .env.example .env   # set DATABASE_URL; CORS_ORIGIN = localhost + https://www.yumix.ge
npm install
npx prisma generate
npx prisma db push
npm run start:dev

# Terminal 2 — Frontend (port 3000)
cd frontend
cp .env.example .env   # API_URL / NEXT_PUBLIC_API_URL = http://localhost:3001
npm install
npm run dev
```

From repo root you can also run:

```bash
npm run dev:api   # backend
npm run dev       # frontend
```

Promote an admin (from `backend/`):

```bash
npx ts-node -r tsconfig-paths/register scripts/make-admin.ts you@example.com
```

## 5. Optional: migrate data from Neon

```bash
pg_dump "$NEON_DATABASE_URL" --no-owner --no-acl -F c -f yumix.dump
pg_restore --clean --if-exists -d "$RENDER_DATABASE_URL" yumix.dump
```

Then point Nest `DATABASE_URL` at Render and stop using Neon.

## Auth

- Login/register go through Next BFF (`/api/auth/login`, `/api/auth/register`) which set an **httpOnly** `yumix_token` cookie.
- Browser API calls use `/api/backend/*` which proxies to Nest with `Authorization: Bearer <token>`.
