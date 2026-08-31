# Yumix API (NestJS)

Backend for Yumix: JWT auth, cart, admin, shop, courier, and restaurant APIs.

- **API:** Render (NestJS)
- **Database:** Supabase PostgreSQL (Prisma)

## Local

```bash
cp .env.example .env
# set DATABASE_URL + DIRECT_URL from Supabase (ORM → Prisma)
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

API: `http://localhost:3001`  
Health: `GET /health`

## Deploy (Render + Supabase)

1. Create a **Supabase** project (free) and copy `DATABASE_URL` + `DIRECT_URL`.
2. Deploy **yumix-api** on Render from `render.yaml` (web service only — no Render Postgres).
3. In Render → **Environment**, paste both Supabase URLs.
4. Set `CORS_ORIGIN=https://www.yumix.ge`.

## Make admin

```bash
npm run make-admin -- you@example.com
```
