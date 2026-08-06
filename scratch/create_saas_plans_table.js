const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSaasPlans() {
  console.log("Creating/verifying saas_plans table and default records...");

  const DEFAULT_PLANS = [
    {
      id: 'free',
      name: 'Free Starter',
      description: 'Perfect for small farms getting started with digital log management.',
      priceMonthly: 0,
      priceAnnual: 0,
      maxBranches: 1,
      cctvEnabled: false,
      aiLoggerEnabled: false,
      exportReportsEnabled: false,
      enterpriseHubEnabled: false,
      features: ['1 Farm Branch Included', 'Basic Egg & Feed Logs', 'Community Forum Support', '2 Staff Accounts']
    },
    {
      id: 'pro',
      name: 'Commercial Pro',
      description: 'For growing poultry farms requiring AI telemetry and automated reports.',
      priceMonthly: 15000,
      priceAnnual: 144000,
      maxBranches: 5,
      cctvEnabled: true,
      aiLoggerEnabled: true,
      exportReportsEnabled: true,
      enterpriseHubEnabled: false,
      features: ['Up to 5 Farm Branches', 'CCTV Live Surveillance', 'AI Voice Auto-Logger', 'PDF & Excel Export Reports', 'Unlimited Staff Accounts']
    },
    {
      id: 'enterprise',
      name: 'Enterprise & Cooperative',
      description: 'For multi-farm operations, cooperative white-label portals, and API access.',
      priceMonthly: 45000,
      priceAnnual: 432000,
      maxBranches: 999,
      cctvEnabled: true,
      aiLoggerEnabled: true,
      exportReportsEnabled: true,
      enterpriseHubEnabled: true,
      features: ['Unlimited Farm Branches', 'Cooperative White-Label Portal', '24/7 Priority Consultant Hotline', 'Custom REST API Keys', 'Multi-Farm Matrix Dashboard']
    }
  ];

  // Insert or upsert plans
  const { data, error } = await supabase.from('saas_plans').upsert(DEFAULT_PLANS);

  if (error) {
    console.error("Upsert Error (table may need DDL creation):", error);
  } else {
    console.log("Successfully initialized saas_plans table in Supabase!");
  }
}

setupSaasPlans();
