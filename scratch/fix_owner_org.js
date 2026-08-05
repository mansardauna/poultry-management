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

async function fixOwnerOrg() {
  console.log("Restoring owner@poultry.com data and organization link...");
  const ownerUserId = '471c832f-ba1b-45cc-9b3a-c523d3efa383';
  const orgId = 'org_owner_main';

  // 1. Upsert organization
  await supabase.from('organizations').upsert({
    id: orgId,
    name: "Owner's Main Farm",
    ownerId: ownerUserId,
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    createdAt: new Date().toISOString()
  });

  // 2. Upsert organization_member
  await supabase.from('organization_members').upsert({
    orgId,
    userId: ownerUserId,
    role: 'Admin'
  });

  // 3. Upsert main workspace
  const workspaceId = `main-${orgId}`;
  await supabase.from('workspaces').upsert({
    id: workspaceId,
    name: 'Main Farm Branch',
    type: 'Layer Farm',
    createdAt: new Date().toISOString(),
    ownerUsername: 'owner'
  });

  // 4. Update all legacy 'main' records to 'main-org_owner_main'
  await Promise.all([
    supabase.from('sales').update({ workspaceId }).eq('workspaceId', 'main'),
    supabase.from('batches').update({ workspaceId }).eq('workspaceId', 'main'),
    supabase.from('eggs').update({ workspaceId }).eq('workspaceId', 'main'),
    supabase.from('feeds').update({ workspaceId }).eq('workspaceId', 'main'),
    supabase.from('health').update({ workspaceId }).eq('workspaceId', 'main'),
    supabase.from('staff').update({ workspaceId }).eq('workspaceId', 'main'),
    supabase.from('invoices').update({ workspaceId }).eq('workspaceId', 'main'),
  ]);

  console.log(`Successfully migrated all legacy 'main' records to workspaceId '${workspaceId}' for owner@poultry.com!`);
}

fixOwnerOrg();
