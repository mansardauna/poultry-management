# 🐔 Poultry Farm Management System (PFMS) — Developer System Architecture & Technical Handbook

> **Version**: 2.0.0-Production  
> **Framework**: Next.js 16.2.6 (App Router & Turbopack)  
> **Database & Auth**: Supabase PostgreSQL & Supabase Auth (`@supabase/supabase-js`)  
> **UI Architecture**: TailwindCSS, Material UI (MUI v6), Lucide Icons, Framer Motion  
> **Payment Gateways**: Paystack (NGN/Local) & Stripe (USD/Global)  

---

## 📋 Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Multi-Role Architecture & Layout Isolation](#2-multi-role-architecture--layout-isolation)
3. [Workspace Multi-Tenancy & Data Isolation](#3-workspace-multi-tenancy--data-isolation)
4. [Database Schemas & Data Dictionary](#4-database-schemas--data-dictionary)
5. [Authentication & Staff Login Credentials](#5-authentication--staff-login-credentials)
6. [Subscription Plans & Payment Gateway Engineering](#6-subscription-plans--payment-gateway-engineering)
7. [Invoice Payment Links & Auto-Settlement Flow](#7-invoice-payment-links--auto-settlement-flow)
8. [Settings, System Config & Super Admin CMS](#8-settings-system-config--super-admin-cms)
9. [API Route Catalog](#9-api-route-catalog)
10. [Deployment & Developer Environment Setup](#10-deployment--developer-environment-setup)

---

## 1. System Overview & Architecture

The **Poultry Farm Management System (PFMS)** is a multi-tenant, enterprise-grade software application designed to handle end-to-end commercial poultry farm operations. The platform supports multi-branch farm setups, real-time egg production tracking, feed inventory threshold alerts, batch mortality logs, sales & invoicing, staff payroll, CCTV predator surveillance, and automated subscription management.

```
                  ┌─────────────────────────────────────────┐
                  │           Client / Browser              │
                  └────────────────────┬────────────────────┘
                                       │ HTTP / Next.js Server Components
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       Next.js 16 App Router             │
                  │   (API Routes + Server Components)      │
                  └────────┬──────────────────────┬─────────┘
                           │                      │
       Supabase JS Client  │                      │ Payment Webhooks
                           ▼                      ▼
           ┌───────────────────────┐   ┌───────────────────────┐
           │  Supabase PostgreSQL  │   │  Paystack & Stripe    │
           │     & Auth Engine     │   │   Payment Gateways    │
           └───────────────────────┘   └───────────────────────┘
```

---

## 2. Multi-Role Architecture & Layout Isolation

PFMS enforces strict Role-Based Access Control (RBAC) across 4 distinct user tiers:

```
                  ┌─────────────────────────────────────────┐
                  │            Platform Users               │
                  └────┬───────────┬───────────┬────────────┘
                       │           │           │
          ┌────────────┴──┐  ┌─────┴─────┐ ┌───┴──────────┐
          │  Super Admin  │  │   Admin   │ │  Manager &   │
          │               │  │  (Owner)  │ │    Staff     │
          └───────────────┘  └───────────┘ └──────────────┘
```

### 👑 Role Matrix & Permissions

| Feature / Navigation | Super Admin (`superadmin@pfms.com`) | Admin (Farm Owner) | Manager (Operations) | Staff (Attendant) |
| :--- | :---: | :---: | :---: | :---: |
| **Super Admin Control Center** | ✅ Exclusive Access | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| **CMS & SaaS Plan Configurator** | ✅ Exclusive Access | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| **Dashboard Analytics & KPIs** | ❌ (Redirected to `/admin`) | ✅ Full Access | ✅ Operations View | ❌ Restracted |
| **Flock Batches & Mortality** | ❌ Hidden | ✅ Full Access | ✅ Operational Log | ✅ Daily Log Entry |
| **Egg Production & Grading** | ❌ Hidden | ✅ Full Access | ✅ Operational Log | ✅ Daily Log Entry |
| **Feed Inventory & Thresholds**| ❌ Hidden | ✅ Full Access | ✅ Operational Log | ✅ Daily Log Entry |
| **Housing & Farm Pens** | ❌ Hidden | ✅ Full Access | ✅ Operational Log | ✅ Daily Log Entry |
| **Health & Medications** | ❌ Hidden | ✅ Full Access | ✅ Full Access | ❌ Hidden |
| **Sales, Invoices & Pay Links** | ❌ Hidden | ✅ Full Access | ✅ View & Issue | ❌ Hidden |
| **Staff & Payroll Management** | ❌ Hidden | ✅ Full Access | ✅ Assign Tasks | ❌ Hidden |
| **Enterprise Management Hub** | ❌ Hidden | ✅ (Pro/Enterprise) | ✅ (Read Only) | ❌ Hidden |
| **Upgrade CTAs & Banners** | ❌ Hidden | ✅ Visible (Free Tier) | ❌ Hidden | ❌ Hidden |
| **Onboarding Wizard Widget** | ❌ Hidden | ✅ Visible (First Setup) | ❌ Hidden | ❌ Hidden |
| **Settings Panel** | ❌ Hidden | ✅ Full Settings | ✅ Operational | 🔒 Profile & Password |

---

## 3. Workspace Multi-Tenancy & Data Isolation

Multi-tenancy in PFMS is governed by the `workspaceId` column present in all operational database tables.

### 🔑 How Workspace Resolution Works (`src/lib/workspace.ts`)

1. **Cookie Priority**: Reads `pfms_workspace` cookie set at authentication.
2. **Owner Special Case**: `owner@poultry.com` is locked to `'main-org_owner_main'`.
3. **Staff Inheritance**: When a `Staff` or `Manager` logs in, `getWorkspaceId()` queries the `staff` and `users` tables for their assigned farm workspace ID (`assignedBranches[0]` or `userRec.workspaceId`).
4. **Primary Farm Fallback**: If a workspace ID does not exist in the `workspaces` table, it binds the user to the primary active farm workspace ID (`mainWorkspaces[0].id`).

---

## 4. Database Schemas & Data Dictionary

All database operations use `@supabase/supabase-js` targeting Supabase PostgreSQL tables.

### 📜 Core Schemas

#### 1. `users` (Authentication & Credentials Table)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff', -- Admin | Manager | Staff | SuperAdmin
  workspaceId TEXT NOT NULL,
  createdBy TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `staff` (Farm Attendants & Operations Roster)
```sql
CREATE TABLE staff (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT,
  role TEXT NOT NULL DEFAULT 'Staff', -- Manager | Staff
  salary NUMERIC DEFAULT 0,
  attendanceDays INTEGER DEFAULT 0,
  contact TEXT,
  assignedBranches JSONB DEFAULT '[]'::jsonb
);
```

#### 3. `workspaces` (Farm Branches & Locations)
```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Main',
  ownerUsername TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `invoices` (Sales & Customer Invoices)
```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  workspaceId TEXT NOT NULL,
  customerName TEXT NOT NULL,
  date TEXT NOT NULL,
  items TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unitPrice NUMERIC NOT NULL DEFAULT 0,
  totalAmount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Unpaid', -- Unpaid | Paid
  saleId TEXT
);
```

#### 5. `systemSettings` (Farm Config, Gateway Keys & Tier)
```sql
CREATE TABLE systemSettings (
  id TEXT PRIMARY KEY,
  workspaceId TEXT UNIQUE NOT NULL,
  subscriptionTier TEXT DEFAULT 'free', -- free | pro | enterprise
  paystackPublicKey TEXT,
  paystackSecretKey TEXT,
  stripePublicKey TEXT,
  stripeSecretKey TEXT,
  bankName TEXT,
  accountNumber TEXT,
  accountName TEXT,
  adminName TEXT,
  adminEmail TEXT
);
```

---

## 5. Authentication & Staff Login Credentials

### 🔐 Staff Login Revocation Lifecycle
When an Admin deletes a staff member:
1. `DELETE /api/staff?id=s12345` deletes the row from `staff`.
2. Deletes matching credentials row from `users`.
3. Revokes Supabase Auth account via `adminClient.auth.admin.deleteUser()`.
4. `POST /api/auth/login` checks active status in `staff` and `users` tables to reject deleted staff logins with **HTTP 401 Unauthorized**:
   > *"This staff account has been removed or revoked by the farm administrator."*

---

## 6. Subscription Plans & Payment Gateway Engineering

PFMS offers 3 subscription tiers:

| Tier | Monthly | Annual (-20%) | Max Branches | CCTV | AI Logger | Badge Tag |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Free Starter** | ₦0 | ₦0 | 1 | ❌ | ❌ | `STARTER` |
| **Commercial Pro** | ₦15,000 | ₦144,000 | Unlimited | ✅ | ✅ | `MOST POPULAR` |
| **Enterprise Plus** | ₦45,000 | ₦432,000 | Unlimited | ✅ | ✅ | `PLUS` |

### 🔒 Payment Gateway & Webhook Security
- **HMAC Signature Verification**: `POST /api/webhooks/paystack` validates `x-paystack-signature` against `PAYSTACK_SECRET_KEY` using HMAC SHA512.
- **Auto-Sync Webhook**: On `charge.success`, updates subscription tier in `organizations`, `systemSettings`, and inserts `subscription_history` receipt.

---

## 7. Invoice Payment Links & Auto-Settlement Flow

```
Customer opens Invoice Link (/pay-invoice/[id])
       │
       ▼
Clicks "Pay ₦X,XXX Now" (Launches Paystack/Stripe Gateway)
       │
       ▼
Customer completes payment with Card / USSD / Bank Transfer
       │
       ▼
Paystack Callback triggers POST /api/pay-invoice
       │
       ├── 1. Verifies Gateway Reference with Paystack API
       ├── 2. Updates `invoices` table record (status = 'Paid')
       ├── 3. Creates / Updates matching `sales` record (status = 'Paid')
       └── 4. Logs settlement alert in `alertLogs`
       │
       ▼
Screen updates instantly to "Invoice Paid & Verified" + PDF Receipt Button
```

---

## 8. Settings, System Config & Super Admin CMS

### 🛡️ Super Admin Control Portal (`/dashboard/admin`)
- Accessible **only** by `superadmin@pfms.com`.
- Manage global landing page CMS hero banners, pricing cards, and feature flags.

---

## 9. API Route Catalog

| Endpoint | Method | Role Required | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/login` | `POST` | Public | Authenticates users & staff, sets role & workspace cookies. |
| `/api/auth/logout` | `POST` | Authenticated | Clears auth session and cookies. |
| `/api/all` | `GET` | Authenticated | Fetches all operational farm data for active workspace. |
| `/api/batches` | `GET`, `POST`, `PUT`, `DELETE` | Admin, Manager, Staff | Manage chicken batch records and mortality. |
| `/api/eggs` | `GET`, `POST` | Admin, Manager, Staff | Log daily egg production & tray grading. |
| `/api/feeds` | `GET`, `POST` | Admin, Manager, Staff | Log feed inventory & consumption. |
| `/api/sales` | `GET`, `POST`, `DELETE` | Admin, Manager | Manage customer sales, orders & invoices. |
| `/api/staff` | `GET`, `POST`, `PUT`, `DELETE` | Admin, Manager | Add staff, assign tasks, track payroll & delete credentials. |
| `/api/pay-invoice` | `POST` | Public | Verifies invoice payment with gateway and auto-settles invoice. |
| `/api/checkout` | `POST` | Admin | Initiates Paystack/Stripe checkout session for plan upgrade. |
| `/api/webhooks/paystack` | `POST` | Gateway | Receives Paystack HMAC verified webhook notifications. |

---

## 10. Deployment & Developer Environment Setup

### 🚀 Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_SECRET_KEY="sk_test_..."
```

### 🛠️ Local Running Commands
```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Verify local production build
npm run build
```

---

*Document compiled and verified for Google Antigravity & Poultry Farm Management System v2.0.*
