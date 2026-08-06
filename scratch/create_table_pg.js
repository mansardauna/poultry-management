const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const dbUrl = env.DATABASE_URL || env.POSTGRES_URL;
console.log("Database URL available:", !!dbUrl);

if (dbUrl) {
  const { Client } = require(path.join(__dirname, 'node_modules/pg'));
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  async function createTable() {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL database!");

    const createSql = `
      CREATE TABLE IF NOT EXISTS public.saas_plans (
        id text PRIMARY KEY,
        name text NOT NULL,
        description text,
        "priceMonthly" numeric DEFAULT 0,
        "priceAnnual" numeric DEFAULT 0,
        "maxBranches" integer DEFAULT 1,
        "cctvEnabled" boolean DEFAULT false,
        "aiLoggerEnabled" boolean DEFAULT false,
        "exportReportsEnabled" boolean DEFAULT false,
        "enterpriseHubEnabled" boolean DEFAULT false,
        features jsonb DEFAULT '[]'::jsonb,
        "updatedAt" timestamp with time zone DEFAULT now()
      );

      INSERT INTO public.saas_plans (id, name, description, "priceMonthly", "priceAnnual", "maxBranches", "cctvEnabled", "aiLoggerEnabled", "exportReportsEnabled", "enterpriseHubEnabled", features)
      VALUES 
      ('free', 'Free Starter', 'Perfect for small farms getting started with digital log management.', 0, 0, 1, false, false, false, false, '["1 Farm Branch Included", "Basic Egg & Feed Logs", "Community Forum Support", "2 Staff Accounts"]'::jsonb),
      ('pro', 'Commercial Pro', 'For growing poultry farms requiring AI telemetry and automated reports.', 15000, 144000, 5, true, true, true, false, '["Up to 5 Farm Branches", "CCTV Live Surveillance", "AI Voice Auto-Logger", "PDF & Excel Export Reports", "Unlimited Staff Accounts"]'::jsonb),
      ('enterprise', 'Enterprise & Cooperative', 'For multi-farm operations, cooperative white-label portals, and API access.', 45000, 432000, 999, true, true, true, true, '["Unlimited Farm Branches", "Cooperative White-Label Portal", "24/7 Priority Consultant Hotline", "Custom REST API Keys", "Multi-Farm Matrix Dashboard"]'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `;

    await client.query(createSql);
    console.log("SUCCESSFULLY created public.saas_plans table and populated default records!");
    await client.end();
  }

  createTable().catch(err => console.error("PG Error:", err));
} else {
  console.log("DATABASE_URL environment variable is not present in .env.local.");
}
