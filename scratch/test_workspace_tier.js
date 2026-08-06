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

async function testWorkspaceTier() {
  console.log("Checking workspaces and users tables...");
  const { data: workspaces, error: wsErr } = await supabase.from('workspaces').select('*');
  console.log("Workspaces:", workspaces, "Error:", wsErr);

  const { data: users, error: userErr } = await supabase.from('users').select('*');
  console.log("Users:", users, "Error:", userErr);
}

testWorkspaceTier();
