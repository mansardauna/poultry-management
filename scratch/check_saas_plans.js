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

async function checkSaasPlans() {
  console.log("Checking saas_plans table in Supabase...");
  
  const { data, error } = await supabase.from('saas_plans').select('*');

  if (error) {
    console.error("ERROR querying saas_plans table:", error);
  } else {
    console.log("saas_plans table records count:", data ? data.length : 0);
    console.log("saas_plans records:", JSON.stringify(data, null, 2));
  }
}

checkSaasPlans();
