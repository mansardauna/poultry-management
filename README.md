# Poultry Management System

A Next.js-based poultry farm management dashboard with a backend API and LibSQL/SQLite support.

## What this project contains

- Next.js 16 app with app router and dashboard pages
- `src/app/api/*` backend routes for staff, eggs, sales, inventory, health, housing, finance, contacts, CCTV, notifications, and more
- DB connection in `src/lib/drizzle.ts` using `@libsql/client` and `drizzle-orm`
- Local SQLite fallback at `src/data/database.sqlite.`
- Remote SQL support via `DATABASE_URL` and optional `DATABASE_AUTH_TOKEN`
- Client-side demo login with `pfms_auth` cookie protection

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Update `.env.local` if you want to use a remote SQL database:

```env
DATABASE_URL=https://<your-libsql-instance>.libsql.net
DATABASE_AUTH_TOKEN=<your_secret_token>
DATABASE_DIALECT=turso
```

4. Run the app locally:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Database notes

- The app currently defaults to `file:src/data/database.sqlite` when `DATABASE_URL` is not set.
- Remote SQL is supported through `DATABASE_URL` in `src/lib/drizzle.ts`.
- `drizzle.config.ts` also uses the same environment vars for migrations.

### Test the DB connection

```bash
npx tsx -e "import { createClient } from '@libsql/client'; async function main(){ const url=process.env.DATABASE_URL ?? 'file:src/data/database.sqlite'; const auth=process.env.DATABASE_AUTH_TOKEN; const client=createClient({ url, ...(auth?{ authToken: auth }:{} ) }); const res=await client.execute('SELECT 1 AS ok'); console.log('URL=' + url); console.log('AUTH=' + (!!auth)); console.log('RESULT=' + JSON.stringify(res.rows)); await client.close(); } main().catch(err=>{ console.error(err); process.exit(1); });"
```

## Authentication

- The app now uses a server-side auth route at `src/app/api/auth/login/route.ts`.
- Credentials are configured using environment variables in `.env.local`:
  - `PFMS_ADMIN_USERNAME` / `PFMS_ADMIN_PASSWORD`
  - `PFMS_MANAGER_USERNAME` / `PFMS_MANAGER_PASSWORD`
  - `PFMS_STAFF_USERNAME` / `PFMS_STAFF_PASSWORD`
- A logout endpoint is available at `POST /api/auth/logout`.
- Production should still replace these values with a secure identity provider or secure session storage.

## Launch readiness checklist

- [x] App runs locally
- [x] Backend routes exist
- [x] DB connection works locally
- [ ] Configure remote SQL env vars
- [ ] Run migrations and verify remote schema
- [ ] Replace demo auth with real authentication
- [ ] Test production build: `npm run build`

## Deployment

### Vercel

1. Create a new Vercel project and connect your repo.
2. Set environment variables in Vercel:
   - `DATABASE_URL`
   - `DATABASE_AUTH_TOKEN` (if needed)
   - `DATABASE_DIALECT=turso`
3. Build command: `npm run build`
4. Output directory: default (Next.js handles it automatically)

### Other hosts

- Ensure Node.js 20+ is available.
- Install dependencies with `npm install`.
- Set the same environment variables used locally.
- Build with `npm run build`.
- Start with `npm run start`.

## Docker deployment

A `Dockerfile` is included for containerized production deployment.

### Prerequisites

- Docker (with BuildKit enabled, which is the default on modern Docker versions)
- A Supabase project (database + auth) and any optional third-party keys (Stripe, Paystack, Gemini)

### Build the image

```bash
docker build -t pms:latest .
```

### Run with environment variables

Pass the same environment variables the app needs at runtime, e.g.:

```bash
docker run -d \
  --name pms \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key> \
  -e SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<key> \
  -e STRIPE_SECRET_KEY=<key> \
  -e STRIPE_WEBHOOK_SECRET=<secret> \
  -e STRIPE_PRO_MONTHLY_PRICE_ID=<id> \
  -e STRIPE_PRO_ANNUAL_PRICE_ID=<id> \
  -e NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<key> \
  -e PAYSTACK_SECRET_KEY=<key> \
  -e GEMINI_API_KEY=<key> \
  pms:latest
```

> Any variable you don't use (e.g. Stripe/Paystack/Gemini) can be omitted.

### Use a `.env` file

Instead of a long `-e` list, put your variables in a `.env` file and pass it to the container:

```bash
docker run -d --name pms -p 3000:3000 --env-file .env pms:latest
```

### docker-compose

Example `docker-compose.yml`:

```yaml
services:
  pms:
    build: .
    image: pms:latest
    container_name: pms
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

Start it with:

```bash
docker compose up -d --build
```

### Notes

- The container listens on port `3000` and serves the production build (`next start`).
- The image runs as a non-root `nextjs` user (uid 1001) by default.
- Environment variables are injected at runtime; the build stage does not require them.
- The app requires a Supabase project at runtime — see the deployment section of `DOCUMENTATION.md` for the full list of supported variables.

## Notes

- This project uses a cookie proxy guard in `src/proxy.ts` to redirect unauthenticated users to `/login`.
- The `src/lib/drizzle.ts` file is the single DB connection entry point.
- `src/data/database.sqlite` is the local SQLite fallback file.
#