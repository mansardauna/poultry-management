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

async function checkAllWorkspaces() {
  console.log("Checking all workspace records...");

  const [sales, eggs, invoices, staff, batches, orgMembers, workspaces] = await Promise.all([
    supabase.from('sales').select('workspaceId'),
    supabase.from('eggs').select('workspaceId'),
    supabase.from('invoices').select('workspaceId'),
    supabase.from('staff').select('workspaceId'),
    supabase.from('batches').select('workspaceId'),
    supabase.from('organization_members').select('*'),
    supabase.from('workspaces').select('*')
  ]);

  console.log("Sales workspace IDs:", sales.data ? [...new Set(sales.data.map(s => s.workspaceId))] : []);
  console.log("Eggs workspace IDs:", eggs.data ? [...new Set(eggs.data.map(e => e.workspaceId))] : []);
  console.log("Invoices workspace IDs:", invoices.data ? [...new Set(invoices.data.map(i => i.workspaceId))] : []);
  console.log("Workspaces Table:", workspaces.data);
  console.log("Organization Members Table:", orgMembers.data);
}

checkAllWorkspaces();
