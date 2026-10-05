# Supabase Database Schema for Poultry Management System (PFMS)

Run the following SQL commands in your **Supabase SQL Editor** (`https://supabase.com/dashboard/project/_/sql/new`) to set up all required database tables for Settings, Multi-Payment Gateways, Saved Payment Methods, and Subscription Billing History.

---

## 1. Create `payment_methods` Table
Stores saved credit/debit cards and Paystack/Stripe tokenized payment sources for each workspace organization.

```sql
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id VARCHAR(255) PRIMARY KEY,
    "workspaceId" VARCHAR(255) NOT NULL,
    "orgId" VARCHAR(255),
    brand VARCHAR(50) NOT NULL DEFAULT 'Visa', -- 'Visa', 'Mastercard', 'Verve'
    last4 VARCHAR(10) NOT NULL, -- e.g. '4242' or '9870'
    "expMonth" INTEGER NOT NULL DEFAULT 12,
    "expYear" INTEGER NOT NULL DEFAULT 2028,
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and permissions
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read/write on payment_methods" ON public.payment_methods FOR ALL USING (true);
```

---

## 2. Create `subscription_history` Table
Logs all billing renewals, plan upgrades, transaction amounts, and official PDF receipts.

```sql
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id VARCHAR(255) PRIMARY KEY,
    "workspaceId" VARCHAR(255) NOT NULL,
    "orgId" VARCHAR(255),
    "planId" VARCHAR(50) NOT NULL, -- 'free', 'pro', 'enterprise'
    "planName" VARCHAR(100) NOT NULL, -- 'Free Starter', 'Commercial Pro', 'Enterprise & Coop'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    status VARCHAR(50) NOT NULL DEFAULT 'Paid', -- 'Paid', 'Pending', 'Failed'
    "receiptUrl" TEXT,
    "paymentMethod" VARCHAR(100) DEFAULT 'Card / Paystack',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and permissions
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read/write on subscription_history" ON public.subscription_history FOR ALL USING (true);
```

---

## 3. Create or Update `systemSettings` Table
Stores payment gateway API keys (Paystack, Stripe, Flutterwave), direct bank wire details, and crate pricing.

```sql
CREATE TABLE IF NOT EXISTS public."systemSettings" (
    id VARCHAR(255) PRIMARY KEY,
    "workspaceId" VARCHAR(255) NOT NULL UNIQUE,
    "eggCratePriceSmall" NUMERIC(10, 2) DEFAULT 4200.00,
    "eggCratePriceLarge" NUMERIC(10, 2) DEFAULT 4400.00,
    "adminName" VARCHAR(255) DEFAULT 'Farm Admin',
    "adminEmail" VARCHAR(255) DEFAULT 'admin@example.com',
    "adminPhone" VARCHAR(100) DEFAULT '+2340000000000',
    "paystackPublicKey" TEXT,
    "paystackSecretKey" TEXT,
    "stripePublicKey" TEXT,
    "stripeSecretKey" TEXT,
    "flutterwavePublicKey" TEXT,
    "flutterwaveSecretKey" TEXT,
    "bankName" VARCHAR(255),
    "accountNumber" VARCHAR(100),
    "accountName" VARCHAR(255),
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and permissions
ALTER TABLE public."systemSettings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read/write on systemSettings" ON public."systemSettings" FOR ALL USING (true);
```

---

## 4. Create or Update `alertSettings` Table
Stores feed threshold alerts and automated SMS/Email/WhatsApp dispatch preferences.

```sql
CREATE TABLE IF NOT EXISTS public."alertSettings" (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "workspaceId" VARCHAR(255) NOT NULL UNIQUE,
    "feedThresholdKg" NUMERIC(10, 2) DEFAULT 50.00,
    "eggDropPercentage" NUMERIC(5, 2) DEFAULT 15.00,
    "minDailyEggCount" INTEGER DEFAULT 0,
    "tempMin" NUMERIC(5, 2) DEFAULT 18.00,
    "tempMax" NUMERIC(5, 2) DEFAULT 28.00,
    "notifySms" BOOLEAN DEFAULT false,
    "notifyEmail" BOOLEAN DEFAULT true,
    "notifyWhatsapp" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and permissions (All access is managed through server-side service-role client with application workspace isolation)
ALTER TABLE public."alertSettings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read/write on alertSettings" ON public."alertSettings" FOR ALL USING (true);
```

-- 5. Create `enterprise_cooperatives` Table
CREATE TABLE IF NOT EXISTS public.enterprise_cooperatives (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "workspaceId" VARCHAR(255) NOT NULL UNIQUE,
    "coopName" VARCHAR(255) NOT NULL DEFAULT 'National Poultry Farmers Cooperative',
    subdomain VARCHAR(100) NOT NULL DEFAULT 'maitama-coop',
    "accentColor" VARCHAR(50) DEFAULT '#4f46e5',
    "logoUrl" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_cooperatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read/write on enterprise_cooperatives" ON public.enterprise_cooperatives FOR ALL USING (true);

-- 6. Create `enterprise_api_keys` Table
CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
    id VARCHAR(255) PRIMARY KEY,
    "workspaceId" VARCHAR(255) NOT NULL,
    "keyName" VARCHAR(100) NOT NULL DEFAULT 'Production ERP Key',
    "secretKey" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read/write on enterprise_api_keys" ON public.enterprise_api_keys FOR ALL USING (true);

-- 7. Create `enterprise_consultants` Table
CREATE TABLE IF NOT EXISTS public.enterprise_consultants (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "workspaceId" VARCHAR(255) NOT NULL,
    "consultantName" VARCHAR(255) NOT NULL DEFAULT 'Dr. Samuel Okafor',
    "phoneNumber" VARCHAR(100) NOT NULL DEFAULT '+2348000000000',
    specialty VARCHAR(255) DEFAULT 'Poultry Vet Specialist',
    "isAvailable" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enterprise_consultants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read/write on enterprise_consultants" ON public.enterprise_consultants FOR ALL USING (true);

---

## 8. Create `farmPens` Table
Stores farm pens, brooding sections, capacity, and temperature log history for housing telemetry.

```sql
CREATE TABLE IF NOT EXISTS public."farmPens" (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "workspaceId" VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER DEFAULT 0,
    "currentBatchId" VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    "temperatureLogs" JSONB DEFAULT '[]'::jsonb,
    "tempMin" NUMERIC(5, 2) DEFAULT NULL,
    "tempMax" NUMERIC(5, 2) DEFAULT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and permissions (Server-side service-role client enforces tenant isolation)
ALTER TABLE public."farmPens" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read/write on farmPens" ON public."farmPens" FOR ALL USING (true);
```

---

## 9. Idempotent Migration Script for Existing Installations
Run these queries if you have an existing Supabase or PostgreSQL database to safely add new columns without dropping data:

```sql
-- Add missing columns idempotently to alertSettings:
ALTER TABLE public."alertSettings" ADD COLUMN IF NOT EXISTS "eggDropPercentage" NUMERIC(5, 2) DEFAULT 15.00;
ALTER TABLE public."alertSettings" ADD COLUMN IF NOT EXISTS "minDailyEggCount" INTEGER DEFAULT 0;
ALTER TABLE public."alertSettings" ADD COLUMN IF NOT EXISTS "tempMin" NUMERIC(5, 2) DEFAULT 18.00;
ALTER TABLE public."alertSettings" ADD COLUMN IF NOT EXISTS "tempMax" NUMERIC(5, 2) DEFAULT 28.00;
ALTER TABLE public."alertSettings" ADD COLUMN IF NOT EXISTS "notifySms" BOOLEAN DEFAULT false;
ALTER TABLE public."alertSettings" ADD COLUMN IF NOT EXISTS "notifyEmail" BOOLEAN DEFAULT true;
ALTER TABLE public."alertSettings" ADD COLUMN IF NOT EXISTS "notifyWhatsapp" BOOLEAN DEFAULT true;

-- Add missing columns idempotently to farmPens:
ALTER TABLE public."farmPens" ADD COLUMN IF NOT EXISTS "temperatureLogs" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public."farmPens" ADD COLUMN IF NOT EXISTS "tempMin" NUMERIC(5, 2) DEFAULT NULL;
ALTER TABLE public."farmPens" ADD COLUMN IF NOT EXISTS "tempMax" NUMERIC(5, 2) DEFAULT NULL;
```

---

## 10. Workspace Isolation & Security Architecture Note
All database access in the application is executed via the server-side Supabase client (`serviceRoleClient` / server database adapter). Direct frontend/browser queries to Supabase are never permitted. Multi-tenant workspace isolation is strictly enforced at the API route and server proxy layer via `getWorkspaceId()` and `applyWorkspaceFilter(query, workspaceId)`. If you wish to enable end-user direct Supabase client queries in the future, replace the permissive RLS policies with JWT-based claim policies (e.g. `USING (auth.jwt() ->> 'workspace_id' = "workspaceId")`).

---

## 11. Verify Setup
After running the SQL queries above in Supabase, your settings, multi-payment gateways, saved card methods, subscription history, housing pens, and Enterprise multi-farm tables will be fully active!

