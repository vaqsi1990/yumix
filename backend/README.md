# Yumix API (NestJS)

Backend for Yumix: JWT auth, cart, admin, shop, courier, and restaurant APIs. Uses Prisma + PostgreSQL (Render).

## Local

```bash
cp .env.example .env
# set DATABASE_URL to Render Postgres (external) or local Postgres
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

API: `http://localhost:3001`  
Health: `GET /health`

## Deploy

See [../DEPLOY.md](../DEPLOY.md) and `render.yaml`.

## Make admin

```bash
npm run make-admin -- you@example.com
```
