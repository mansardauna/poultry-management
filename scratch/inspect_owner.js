const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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

async function checkOwnerData() {
  console.log("Checking owner@poultry.com data...");
  
  // Find owner user
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const ownerUser = usersData?.users.find(u => u.email === 'owner@poultry.com');
  console.log("Owner User:", ownerUser ? { id: ownerUser.id, email: ownerUser.email } : "Not found");

  let ownerOrgId = null;
  if (ownerUser) {
    const { data: members } = await supabase.from('organization_members').select('*').eq('userId', ownerUser.id);
    console.log("Owner Org Members:", members);
    if (members && members[0]) {
      ownerOrgId = members[0].orgId;
    }
  }

  // Count items in tables where workspaceId = 'main'
  const [sales, batches, eggs, feeds, health, staff, invoices] = await Promise.all([
    supabase.from('sales').select('count', { count: 'exact' }).eq('workspaceId', 'main'),
    supabase.from('batches').select('count', { count: 'exact' }).eq('workspaceId', 'main'),
    supabase.from('eggs').select('count', { count: 'exact' }).eq('workspaceId', 'main'),
    supabase.from('feeds').select('count', { count: 'exact' }).eq('workspaceId', 'main'),
    supabase.from('health').select('count', { count: 'exact' }).eq('workspaceId', 'main'),
    supabase.from('staff').select('count', { count: 'exact' }).eq('workspaceId', 'main'),
    supabase.from('invoices').select('count', { count: 'exact' }).eq('workspaceId', 'main'),
  ]);

  console.log("Records with workspaceId = 'main':", {
    sales: sales.count,
    batches: batches.count,
    eggs: eggs.count,
    feeds: feeds.count,
    health: health.count,
    staff: staff.count,
    invoices: invoices.count,
  });

  if (ownerOrgId) {
    const targetWorkspaceId = `main-${ownerOrgId}`;
    console.log(`Re-assigning workspaceId = 'main' records to owner's workspace: ${targetWorkspaceId}...`);
    
    await Promise.all([
      supabase.from('sales').update({ workspaceId: targetWorkspaceId }).eq('workspaceId', 'main'),
      supabase.from('batches').update({ workspaceId: targetWorkspaceId }).eq('workspaceId', 'main'),
      supabase.from('eggs').update({ workspaceId: targetWorkspaceId }).eq('workspaceId', 'main'),
      supabase.from('feeds').update({ workspaceId: targetWorkspaceId }).eq('workspaceId', 'main'),
      supabase.from('health').update({ workspaceId: targetWorkspaceId }).eq('workspaceId', 'main'),
      supabase.from('staff').update({ workspaceId: targetWorkspaceId }).eq('workspaceId', 'main'),
      supabase.from('invoices').update({ workspaceId: targetWorkspaceId }).eq('workspaceId', 'main'),
      supabase.from('workspaces').update({ id: targetWorkspaceId }).eq('id', 'main')
    ]);

    console.log("Successfully re-assigned all legacy 'main' data to owner@poultry.com!");
  }
}

checkOwnerData();
