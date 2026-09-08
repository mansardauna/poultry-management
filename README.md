# Poultry Farm Management System

A multi-tenant poultry farm management dashboard built with **Next.js 16**, **React 19**, and **Supabase** (PostgreSQL + Auth). It covers flocks/batches, egg production, feed inventory, housing, health, sales & invoicing, staff & payroll, finance, CCTV, notifications, and enterprise features (white-label portals, custom API keys, cooperative hubs) with online payment via **Paystack** and **Stripe** and AI-powered logging via **Google Gemini**.

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack) + TypeScript
- **UI**: Tailwind CSS v4, Material UI, Lucide + Iconsax icons, Recharts
- **Database & Auth**: Supabase PostgreSQL + Supabase Auth, multi-tenant via workspace isolation
- **Payments**: Paystack (NGN) & Stripe (USD), webhook-based subscription management
- **PWA**: `@ducanh2912/next-pwa`

## Requirements

- Node.js 20.9+ (Node 22 LTS recommended)
- A Supabase project (database + auth). See `supabase_subscription_schema.md` for the SQL schema and `DOCUMENTATION.md` for the full developer handbook.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local`. The minimum you need is a Supabase project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional keys for Stripe, Paystack, and the Gemini AI logger can be added later — see `.env.example`.

4. Run the app locally:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## First-run installation

On first launch, visit `/setup` and complete the installation wizard. It provisions the Supabase tables/settings, creates the **Super Admin** account (email + password), and lets you configure your farm name, currency, and payment gateways. After setup completes you will be redirected to log in.

## Commands

```bash
npm run dev      # start the dev server on http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # run ESLint
```

## Authentication

- Authentication is handled by **Supabase Auth** (email/password).
- Roles: `SuperAdmin`, `Admin`, `Manager`, `Staff`.
- `src/proxy.ts` is the Next.js 16 proxy (middleware) file — it redirects unauthenticated visitors to `/login` and injects the user's role/org headers, while API routes and the public `/pay-invoice/:id` page are exempt.
- API routes resolve the current tenant via `getWorkspaceId()` in `src/lib/workspace.ts`.

## Deployment

### Docker

See the [Docker deployment](#docker-deployment) section below.

### Vercel

1. Create a Vercel project and connect your repo.
2. Add the environment variables from `.env.example` (Supabase keys are required).
3. Build command: `npm run build`
4. Output directory: default (Next.js handles it automatically)

### Other hosts

- Ensure Node.js 20.9+ is available.
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

- This project uses the Next.js 16 proxy file convention (`src/proxy.ts`) to redirect unauthenticated users to `/login`.
- Database access is centralized in `src/lib/supabase.ts` (server, service-role) and `src/lib/supabaseServer.ts` (SSR auth client).
- See `DOCUMENTATION.md` for the developer architecture handbook and `supabase_subscription_schema.md` for the database schema.
#