# Poultry Management System (PMS)

A production-grade multi-tenant poultry farm management platform built on Next.js 16 (App Router), React 19, and Tailwind CSS, featuring flexible database support (MySQL, PostgreSQL, or Supabase) with signed JWT session authentication and role-based access control.

---

## Features

- **Multi-Tenant Architecture**: Organization-level tenancy with workspace isolation and verified tenant context.
- **Role-Based Access Control**: `SuperAdmin`, `FarmAdmin`, `Manager`, and `Staff` roles with secure session tokens (`jose` cryptographic HS256 JWTs).
- **Core Poultry Operations**:
  - **Flock & Batch Management**: Track bird breeds, age in weeks, transfers, vaccinations, and mortality rates.
  - **Egg Production**: Daily logging of good, bad, and broken eggs with automated crate calculations.
  - **Feed Inventory & Logistics**: Restocking, consumption logging, minimum stock alerts, and procurement tracking.
  - **Finance & Accounting**: Point of sale, invoices, cash flow tracking, expense classification, and staff payroll.
  - **Health & Medication**: Preventative schedules, vaccination calendars, and automated alerts.
  - **Housing & Pens**: Pen capacity allocation, temperature logging, and batch movements.
  - **Equipment & Assets**: Machinery maintenance logs, status tracking, and inventory.
  - **CCTV & Monitoring**: Live stream RTSP/serial hardware integration and gateway ping logging.
  - **SuperAdmin CMS & Tenant Provisioning**: Tenant onboarding, workspace provisioning, impersonation controls, and SaaS revenue analytics.

---

## Architecture & Database Support

PMS uses a decoupled data adapter layer (`src/lib/dataAdapter.ts` and `src/lib/supabase.ts`) supporting three backend database engines:

1. **Local / Self-Hosted MySQL**: Native `mysql2` connection pooling.
2. **Local / Self-Hosted PostgreSQL**: Native `pg` connection pooling.
3. **Cloud Supabase**: Supabase JavaScript client with resilience timeouts.

The active engine is determined via `data/database.config.json` or standard environment variables (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`).

---

## Getting Started

### 1. Prerequisites
- Node.js 20+ (recommended: Node 22+)
- MySQL 8+, PostgreSQL 15+, or a Supabase project

### 2. Installation

```bash
git clone https://github.com/mansardauna/poultry-management.git
cd poultry-management
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Session Secret (min 32 characters; auto-generated if omitted)
SESSION_SECRET="your-super-strong-jwt-secret-key-at-least-32-chars"

# Database Connection (Optional if using data/database.config.json)
DATABASE_URL="mysql://root:password@localhost:3306/poultry_db"

# Optional Cloud Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_FETCH_TIMEOUT_MS=15000

# Optional Initial SuperAdmin Bootstrap Credentials
PFMS_ADMIN_USERNAME="admin@poultry.com"
PFMS_ADMIN_PASSWORD="YourStrongSuperAdminPassword2026!"
```

### 4. Database Initialization

For self-hosted MySQL or PostgreSQL databases, apply the initial schema from `db/schema.sql`:

```bash
# MySQL
mysql -u root -p poultry_db < db/schema.sql

# PostgreSQL
psql -U postgres -d poultry_db -f db/schema.sql
```

Alternatively, launching the application will automatically run the onboarding wizard at `/setup` to configure your database engine and bootstrap the initial organization workspace.

### 5. Running the Application

```bash
# Development server (Turbopack)
npm run dev

# Production build
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Security Model

- **Session Tokens**: Sessions are sealed in HTTP-only, SameSite=Lax signed cookies (`pfms_session`) verified cryptographically on every request via `jose`.
- **Tenant Isolation**: Workspace IDs are derived server-side from verified JWT claims. Cross-tenant access is blocked at the routing layer and rejected in database queries.
- **Credential Storage**: User and staff passwords are encrypted using `bcrypt` (10 rounds). Plaintext password comparisons are strictly prohibited.
- **Impersonation**: SuperAdmin impersonation generates an explicit, auditable token bearing the SuperAdmin's identity. Exiting impersonation cryptographically re-verifies the parent SuperAdmin session.

---

## Project Structure

```
├── db/
│   └── schema.sql              # ANSI SQL schema definitions
├── data/
│   └── database.config.json    # Local engine configuration (MySQL/PostgreSQL)
├── src/
│   ├── app/
│   │   ├── api/                # API routes (auth, tenants, batches, sales, feeds, etc.)
│   │   ├── dashboard/          # Farm operations & superadmin dashboards
│   │   ├── login/              # Authentication portal
│   │   └── setup/              # First-time database onboarding wizard
│   ├── components/             # Reusable UI & dashboard client components
│   ├── lib/
│   │   ├── auth.ts             # Server-side auth user extraction
│   │   ├── session.ts          # Cryptographic JWT signing & verification
│   │   ├── sessionCookies.ts   # Cookie helper utilities
│   │   ├── workspace.ts        # Tenant workspace resolution & query scoping
│   │   └── supabase.ts         # Unified database client adapter
│   └── proxy.ts                # Next.js route protection & session guard
└── package.json
```

---

## License

MIT License.