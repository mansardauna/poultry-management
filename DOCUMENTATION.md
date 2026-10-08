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
11. [Product Feature, Sitemap & Marketing Wireframe Guide](#11-product-feature-sitemap--marketing-wireframe-guide)

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
3. **Staff Inheritance**: When a `Staff` or `Manager` logs in, `getWorkspaceId()` queries the `staff` and `users` tables for their assigned farm workspace ID.
4. **Primary Farm Fallback**: If a workspace ID does not exist in the `workspaces` table, it binds the user to the primary active farm workspace ID (`mainWorkspaces[0].id`).

---

## 4. Database Schemas & Data Dictionary

All primary entity tables (`batches`, `eggs`, `feeds`, `sales`, `finance`, `staff`, `contacts`, `cctvLogs`, `systemSettings`) include mandatory `workspaceId` string columns indexed for high performance query isolation.

---

## 5. Authentication & Staff Login Credentials

Authentication is handled natively by Supabase Auth with custom fallback JWT validation.

---

## 6. Subscription Plans & Payment Gateway Engineering

| Plan Tier | Monthly Price | Annual Price | Farm Branches | CCTV Live Stream | AI Auto-Logger | Badge |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Free Starter** | ₦0 | ₦0 | 1 Branch | ❌ | ❌ | `STARTER` |
| **Commercial Pro** | ₦15,000 | ₦144,000 | Unlimited | ✅ | ✅ | `MOST POPULAR` |
| **Enterprise Plus** | ₦45,000 | ₦432,000 | Unlimited | ✅ | ✅ | `PLUS` |

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
Accessible **only** by authenticated `SuperAdmin` roles (e.g. `owner@poultry.com`, `superadmin@pfms.com`, `admin@pfms.com`). Governed by 6 core modules:

1. **Platform Telemetry & Fleet Overview**:
   - Total registered tenant farm organizations and active subscription count.
   - Monthly Recurring Revenue (MRR) rollups with real-time currency conversion.
   - Node.js runtime heap memory inspection, active database engine status (MySQL/PostgreSQL/Supabase), and latency ping health.
   - 12-month tenant acquisition and recurring revenue Recharts trend graphs.

2. **API Gateways & Global Integrations (`/api/admin/gateways`)**:
   - **Paystack Merchant Gateway**: Secret Key (`sk_live/test`), Public Key (`pk_live/test`), webhook endpoint (`/api/webhooks/paystack`), Live/Test mode toggle.
   - **Stripe Merchant Gateway**: Secret Key (`sk_live/test`), Publishable Key (`pk_live/test`), webhook signing secret (`whsec_...`), Live/Test mode toggle.
   - **Multi-Provider AI Assistant Engine**: Built-in presets for 9 providers: Google Gemini (`gemini-3.5-flash`), OpenAI (`gpt-4o-mini`), Groq Cloud (`llama-3.3-70b-versatile`), DeepSeek AI (`deepseek-chat`), Anthropic Claude (`claude-3-5-sonnet`), OpenRouter (200+ models), Mistral AI, Ollama local/self-hosted, and custom OpenAI-compatible endpoints with live connectivity test.
   - **Transactional SMTP Email Gateway**: Outbound SMTP server configuration (Host, Port 587/465, SSL/TLS, credentials, sender address).
   - **CCTV & IoT Proxy Gateway**: Global RTSP video proxy stream settings and predator alert notification dispatch.

3. **SaaS Subscription Plans & Multi-Currency Engine (`/api/admin/plans`)**:
   - Tier configurations: Starter (Free), Commercial (Pro), Industrial (Enterprise).
   - Base USD pricing with automated multi-currency conversion for **NGN (₦), KES (KSh), GHS (GH₵), ZAR (R), INR (₹), IDR (Rp), EUR (€), and GBP (£)**.
   - Resource quotas: Max flock bird limits, staff seats, pen houses, AI monthly prompt tokens, CCTV stream quotas, priority SLA support.
   - Real-time synchronization with public checkout and `/pricing` page.

4. **Landing Page CMS & Platform White-Labeling (`/api/admin/cms`)**:
   - Hero Section editor (headline, sub-headline, CTA buttons, hero banner image upload).
   - Platform brand identity & white-labeling (Platform name, tagline, primary/secondary/accent HEX color pickers, brand logo upload via `/api/admin/upload-logo`, favicon).
   - Feature Highlights showcase (CRUD operations on marketing value propositions).
   - Global Announcement Banner (sticky top bar with info/warning/critical alert styling).
   - Public Footer and legal links (support email, terms of service, privacy policy).

5. **Multi-Tenant Fleet Administration (`/api/admin/tenants`)**:
   - Tenant Organization Directory with search by farm name, owner email, or org ID.
   - Manual subscription overrides: Upgrade/downgrade tiers, extend active subscription validity, or set custom expiration dates without processing card charges.
   - **One-Click Tenant Impersonation ("Login as Tenant")**:
     - Securely inspect any customer's live farm dashboard without requiring or modifying their password.
     - Cryptographically signed impersonation session (`impersonatedBy: 'superadmin'`).
     - Persistent top-level purple banner with **"Exit Impersonation & Return to Superadmin"** button.
   - Account suspension, manual tenant creation, and tenant deletion/purge.

6. **Security & System Governance**:
   - Master credential rotation with bcrypt password hashing.
   - Two-Factor Authentication (2FA / TOTP) enforcement.
   - Global Platform Maintenance Mode: Locks out non-superadmin users with a customizable notice while preserving Super Admin diagnostic access.

---

## 9. API Route Catalog

| Endpoint | Method | Role Required | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/signup` | `POST` | Public | Registers a new farm admin, creates tenant organization and default workspace. |
| `/api/auth/login` | `POST` | Public | Authenticates users & staff, handles 2FA TOTP verification, sets signed JWT session. |
| `/api/auth/logout` | `POST` | Authenticated | Clears auth session and UI cookies. |
| `/api/auth/me` | `GET` | Authenticated | Returns currently authenticated user identity and active tenant workspace. |
| `/api/all` | `GET` | Authenticated | Fetches complete operational farm datasets for active tenant workspace. |
| `/api/batches` | `GET`, `POST`, `PUT`, `DELETE` | Admin, Manager, Staff | Manage flock batches, pen allocations, and mortality logs. |
| `/api/eggs` | `GET`, `POST` | Admin, Manager, Staff | Log daily egg production, good eggs vs damaged eggs grading. |
| `/api/feeds` | `GET`, `POST` | Admin, Manager, Staff | Log feed inventory, restocking, and daily consumption. |
| `/api/sales` | `GET`, `POST`, `DELETE` | Admin, Manager | Manage customer orders, sales ledger, and invoice generation. |
| `/api/finance` | `GET`, `POST` | Admin, Manager | Expense tracking, financial categorization, and net profit rollups. |
| `/api/staff` | `GET`, `POST`, `PUT`, `DELETE` | Admin, Manager | Add staff, manage role permissions, assign shifts, and disburse payroll. |
| `/api/pay-invoice` | `POST` | Public | Public payment endpoint for invoices: settles online Paystack/Stripe or verifies offline transfer. |
| `/api/checkout` | `POST` | Admin | Initiates Paystack/Stripe checkout session for tenant plan upgrades. |
| `/api/webhooks/paystack` | `POST` | Gateway | Receives Paystack HMAC-verified webhook notifications for auto-settlement. |
| `/api/webhooks/stripe` | `POST` | Gateway | Receives Stripe webhook notifications for auto-settlement. |
| `/api/admin/gateways` | `GET`, `POST` | SuperAdmin | Manage Paystack, Stripe, AI provider, and SMTP email credentials. |
| `/api/admin/plans` | `GET`, `POST`, `PUT`, `DELETE` | SuperAdmin / Public GET | Manage SaaS subscription plans, multi-currency rates, and quotas. |
| `/api/admin/tenants` | `GET`, `POST`, `PUT`, `DELETE` | SuperAdmin | Tenant fleet directory, subscription overrides, and one-click impersonation. |
| `/api/admin/cms` | `GET`, `POST` | SuperAdmin / Public GET | Landing page CMS, hero banner, announcement banner, and legal footer. |
| `/api/admin/upload-logo` | `POST` | SuperAdmin | Upload custom platform brand logo and favicon assets. |

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

---

## 11. Product Feature, Sitemap & Marketing Wireframe Guide

### 🧭 Sitemap Architecture
```
Public Landing & Onboarding
 ├── /                       -> Public Commercial Landing Page
 ├── /pricing                -> Subscription Plans & Feature Matrix
 ├── /login                  -> Unified Single-Farm & Enterprise Portal
 ├── /signup                 -> User Registration & Trial Initialization

Authenticated Operational Dashboard (/dashboard)
 ├── Main Telemetry          -> Real-time KPIs, Alert Logs, & Onboarding Widget
 ├── /dashboard/chickens     -> Flock Batches, Breeds, Mortality, & Transfers
 ├── /dashboard/housing      -> Pen Coops, Capacity Allocation, & Climate Status
 ├── /dashboard/eggs         -> Daily Egg Collections, Cushion Audits, & Maturation
 ├── /dashboard/feed         -> Feed Inventory, Daily Consumption Logs, & Restock Pipeline
 ├── /dashboard/health       -> Vaccination Templates, Booster Schedules, & Vet Logs
 ├── /dashboard/sales        -> Sales Records, Paystack/Stripe Invoices, & Customer Orders
 ├── /dashboard/finance      -> Expense Ledger, Payroll Disbursement, & Profit/Loss
 ├── /dashboard/inventory    -> Farm Machinery, Tools, Equipment Maintenance
 ├── /dashboard/staff        -> Attendant Roster, Role-Based Access (Admin/Manager/Staff)
 ├── /dashboard/contacts     -> Supplier & Buyer CRM Directory
 ├── /dashboard/cctv         -> WebRTC Security Camera Monitoring & QR Pairing
 ├── /dashboard/enterprise   -> Multi-Branch Matrix, White-Label Branding, & Vet Hotline
 ├── /dashboard/settings     -> Account Settings, Branch Setup, & Billing Plans
 └── /dashboard/admin        -> Super Admin Portal & Landing Page CMS Editor
```

### 💳 Subscription Tier Matrix
- **Free Account**: 1 Branch, Basic Batches, Basic Egg Charts, 1 Staff.
- **Commercial Pro (₦15,000 / mo)**: Unlimited Branches, 2 CCTV Cameras, AI Voice Logger, PDF/Excel Exports, 5 Staff.
- **Enterprise Plus (₦45,000 / mo)**: Unlimited Multi-Farm Matrix, Unlimited WebRTC Cameras, White-Label Suite, Custom REST API Tokens, 24/7 Priority Vet Tickets.

---

*Document compiled and verified for Google Antigravity & Poultry Farm Management System v2.0.*
