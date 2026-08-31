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
