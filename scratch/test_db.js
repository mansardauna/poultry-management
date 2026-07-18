const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env because dotenv is not in standard dependencies
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://dwjddjndeaqxlaqynjsy.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JUFRU5jxawzW5H4FyPeCqw_7plDdl0n';

console.log("Using URL:", supabaseUrl);
console.log("Using Key prefix:", supabaseKey.substring(0, 10));

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing workspaces table...");
  const { data, error } = await supabase.from('workspaces').select('*').limit(5);
  if (error) {
    console.error("Error fetching workspaces:", error);
  } else {
    console.log("Fetch success. Row count:", data.length);
    console.log("Workspaces in db:", data);
  }

  console.log("Testing workspaces with ownerUsername filter...");
  const { data: data2, error: error2 } = await supabase.from('workspaces').select('*').eq('ownerUsername', 'owner');
  if (error2) {
    console.error("Error filtering workspaces by ownerUsername:", error2);
  } else {
    console.log("Filter success. Found:", data2);
  }

  console.log("Testing users table...");
  const { data: users, error: errorUsers } = await supabase.from('users').select('id, username, role');
  if (errorUsers) {
    console.error("Error fetching users:", errorUsers);
  } else {
    console.log("Users in db:", users);
  }
}

test();
