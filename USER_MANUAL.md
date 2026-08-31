# 📖 Poultry Farm Management System (PFMS) — End-User Operational Manual

Welcome to the **Poultry Farm Management System (PFMS)**! This official User Manual provides step-by-step instructions for Farm Owners (Admins), Farm Managers, and Farm Attendants (Staff) to operate the platform efficiently.

---

## 📋 Table of Contents
1. [Getting Started & Installation](#1-getting-started--installation)
2. [Dashboard Telemetry & Navigation](#2-dashboard-telemetry--navigation)
3. [Flock Batches & Mortality Tracking](#3-flock-batches--mortality-tracking)
4. [Egg Production & Daily Collections](#4-egg-production--daily-collections)
5. [AI Voice & Text Auto-Logger](#5-ai-voice--text-auto-logger)
6. [Feed Inventory & Consumption Logs](#6-feed-inventory--consumption-logs)
7. [Health & Vaccination Templates](#7-health--vaccination-templates)
8. [Sales, Invoices & Online Payment Links](#8-sales-invoices--online-payment-links)
9. [Finance & Staff Payroll Disbursement](#9-finance--staff-payroll-disbursement)
10. [CCTV Live Security Surveillance](#10-cctv-live-security-surveillance)
11. [Enterprise Multi-Farm Hub](#11-enterprise-multi-farm-hub)
12. [Super Admin Control Center](#12-super-admin-control-center)

---

## 1. Getting Started & Installation

### A. Initial Setup Wizard (`/setup`)
For buyers installing PFMS on a self-hosted server or cloud host:
1. Navigate to `https://your-domain.com/setup`.
2. **Step 1 (Database Engine)**: Select your preferred database driver (**⚡ Supabase Cloud**, **🐘 Standard PostgreSQL**, or **🐬 MySQL / MariaDB**). View the official documentation link provided for step-by-step connection settings.
3. **Step 2 (Super Admin Account)**: Enter your master Super Admin email (`owner@poultry.com`) and secure password (`poultry2026`). Customize your platform brand name and primary currency symbol (₦, $, €, £).
4. **Step 3 (Payment Gateways)**: Enter your Paystack and Stripe public/secret API keys for automatic online invoice payments and plan subscription checkouts.
5. **Step 4 (Emails & Pricing)**: Configure your Resend API key (`re_...`) for transactional email notifications and define your Pro/Enterprise monthly subscription pricing.
6. **Step 5 (Finish & Launch)**: Click **Complete Installation** to launch your live platform.

### B. User Login Credentials
- **Default Master Admin**: `owner@poultry.com` | Password: `poultry2026`
- **Default Super Admin**: `superadmin@pfms.com` | Password: `poultry2026`

---

## 2. Dashboard Telemetry & Navigation

Upon logging in, you arrive at the **Main Telemetry Dashboard (`/dashboard`)**:
- **Core Telemetry KPI Cards**: Shows real-time Total Active Flock, Daily Egg Yield (Crates), Feed Stock Remaining (Kg), and Operational Profit (₦).
- **Onboarding Progress Widget**: Displays a 4-step interactive setup checklist for brand-new farm accounts.
- **Production Analytics Charts**: Daily egg collection bar charts and financial revenue vs expense trend lines.
- **Top Quick Search Bar**: Type any module keyword (e.g. `Batches`, `Feed`, `Invoices`, `Staff`) to jump instantly across all 13 farm modules.

---

## 3. Flock Batches & Mortality Tracking

Navigate to **Flock Batches (`/dashboard/chickens`)**:
1. **Register New Batch**: Click **+ Register New Batch**, choose flock type (**Layer**, **Broiler**, **Pullet**), enter bird quantity, breed (e.g. Isa Brown, Cobb 500), age in weeks, and assign a housing pen.
2. **Log Daily Mortality**: Click **[Log Mort]** next to any active flock. Enter bird loss count and select the cause (Heat Stress, Disease, Natural, Predator). The system automatically deducts lost birds from active inventory and updates flock mortality rate percentages.
3. **Inter-Pen Transfers**: Click **[Transfer]** to move birds between housing coops (e.g. moving pullets from brooding house to layer cages).

---

## 4. Egg Production & Daily Collections

Navigate to **Egg Collections (`/dashboard/eggs`)**:
1. **Log Daily Lay**: Click **+ Log Daily Lay**, select the layer batch, enter good eggs count, cracked/broken eggs count, and dirty eggs count.
2. **Automatic Crate Conversion**: PFMS automatically converts raw egg counts into standard crates (**30 eggs per crate**). For example, 4,200 good eggs = **140 Crates**.
3. **Nest Box Cushioning Audits**: Rate nesting box cleanliness (95% Clean, Needs Refresh) to prevent cracked eggs and improve laying hygiene.
4. **Pullet Maturation Tracking**: Monitor pullets entering first lay stage to predict peak laying timelines.

---

## 5. AI Voice & Text Auto-Logger

Look for the floating **AI Auto-Log Button (Sparkles/Mic Icon)** at the bottom-right corner of your screen:
1. Click the floating AI button to open the voice/text modal.
2. **Speak or Type Raw Notes**: For example:
   > *"We collected 15 crates of eggs today from Pen A, fed 8 bags of Layer Mash, and sold 10 crates for ₦35,000 cash."*
3. **One-Click Parsing**: Click **Parse & Save Log**. The built-in AI engine automatically extracts egg collection counts, feed usage weights, and sales receipts, inserting them directly into your database tables in 1 second!

---

## 6. Feed Inventory & Consumption Logs

Navigate to **Feed Inventory (`/dashboard/feed`)**:
1. **Log Daily Feed Use**: Click **+ Record Feed Use**, select feed type (Layer Mash 25, Broiler Starter, Finisher), enter bags used and total Kilograms consumed per batch.
2. **Low-Stock Safety Alerts**: If feed inventory drops below your safety threshold (e.g. 500 Kg), the dashboard automatically triggers a critical warning badge and alert log notification.
3. **Procurement Pipeline**: Track incoming feed restock shipments from suppliers.

---

## 7. Health & Vaccination Templates

Navigate to **Flock Health (`/dashboard/health`)**:
1. **Pre-Built Vaccination Templates**: Select pre-configured vaccination protocols for Newcastle (Lasota), Gumboro (IBD), Marek's, or Fowl Pox.
2. **Apply to Batch**: Select a target flock batch. The system calculates exact calendar dates based on bird age (Day 7, Day 14, Day 21).
3. **Mark Completed**: Attendants mark vaccinations as completed and attach vet administration notes.

---

## 8. Sales, Invoices & Online Payment Links

Navigate to **Sales & Invoices (`/dashboard/sales`)**:
1. **Record New Sale**: Click **+ Record New Sale**, enter customer details, product type (Egg Crates, Live Birds), quantity, and unit price.
2. **Generate Digital Invoice**: The system generates a digital invoice number (e.g. `INV-8021`) with itemized totals and tax calculations.
3. **Online Paystack / Stripe Payment Links**:
   - Click **[Share Pay Link]** to copy or send an online payment link (`/pay-invoice/[id]`) directly via WhatsApp or Email.
   - When the customer pays online via Card, USSD, or Bank Transfer, Paystack/Stripe webhooks automatically mark the invoice as **[Paid]**, log the sales revenue, and update your financial ledger!

---

## 9. Finance & Staff Payroll Disbursement

Navigate to **Finance & Expense Ledger (`/dashboard/finance`)**:
1. **Log Expenses**: Click **+ Log Expense**, categorize expense items (Feed Restock, Medication, Utilities, Logistics, Machinery Repair), enter amount and payment date.
2. **Staff Payroll Disbursement**: Add farm staff in **`/dashboard/staff`** with monthly salary rates. In the Finance tab, click **Process Monthly Payroll** to auto-generate salary disbursements and log them into your ledger.
3. **Profit & Loss Summary**: View real-time Net Profit statements (`Total Income − Total Expenses = Net Profit`).

---

## 10. CCTV Live Security Surveillance

Navigate to **CCTV Security (`/dashboard/cctv`)**:
1. **Pair Security Cameras**: Scan the QR code or enter your IP camera / smartphone WebRTC stream link.
2. **24/7 Live Monitoring**: View live video feeds from your poultry coops to prevent bird theft, monitor feed trough activity, and detect predator intruders.

---

## 11. Enterprise Multi-Farm Hub

For **Commercial Pro** and **Enterprise Tier** accounts (`/dashboard/enterprise`):
1. **Multi-Farm Branch Matrix (`/branches`)**: View real-time live telemetry aggregated across all regional farm branches (Lagos Branch, Ibadan Branch, Abuja Branch) and execute inter-branch stock transfers.
2. **White-Label Suite (`/whitelabel`)**: Upload custom farm logos, configure custom subdomains (`myfarm.poultry.com`), and customize portal color themes.
3. **REST API Tokens (`/api`)**: Generate custom API tokens for third-party ERP, accounting, or mobile app integrations.
4. **24/7 Vet Hotline (`/vet`)**: Submit direct priority consultation tickets to certified veterinary specialists.
5. **Feed Pool (`/feed-pool`)**: Join wholesale feed group buying pools to purchase feed in bulk at discounted cooperative rates.

---

## 12. Super Admin Control Center

For **Super Admin (`superadmin@pfms.com`)** (`/dashboard/admin`):
- **SaaS Tenant Overview**: Track total active farm accounts, active subscriptions, and Monthly Recurring Revenue (MRR).
- **Landing Page CMS Editor**: Update hero titles, pricing plans, testimonials, and FAQ content live without touching code.
- **Gateway & Feature Controls**: Toggle global feature switches (`cctvEnabled`, `aiLoggerEnabled`, `exportReportsEnabled`, `enterpriseHubEnabled`) across all tenant tiers dynamically.

---

## 🖨️ How to Export & Print Reports
Click the **Print Report** button located at the top-right of the **Dashboard**, **Eggs**, **Sales**, or **Finance** pages to generate instant, formatted PDF reports suitable for bank loans, investors, and farm audits.

---
*Official User Manual — Poultry Farm Management System (PFMS) v2.0 Production Release.*
