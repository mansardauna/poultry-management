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

async function fixOwnerPermanent() {
  console.log("Locating owner@poultry.com user account...");
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const ownerUser = usersData?.users.find(u => u.email === 'owner@poultry.com');

  if (!ownerUser) {
    console.error("owner@poultry.com user not found!");
    return;
  }

  const userId = ownerUser.id;
  console.log("Owner User ID:", userId);

  // Use a canonical orgId for owner@poultry.com
  const canonicalOrgId = 'org_owner_main';
  const canonicalWorkspaceId = `main-${canonicalOrgId}`;

  // 1. Upsert organization
  await supabase.from('organizations').upsert({
    id: canonicalOrgId,
    name: "Owner's Main Farm",
    ownerId: userId,
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    createdAt: new Date().toISOString()
  });

  // 2. Clear conflicting organization_members for this user and insert canonical link
  await supabase.from('organization_members').delete().eq('userId', userId);
  await supabase.from('organization_members').insert([{
    orgId: canonicalOrgId,
    userId: userId,
    role: 'Admin'
  }]);

  // 3. Upsert canonical workspace
  await supabase.from('workspaces').upsert({
    id: canonicalWorkspaceId,
    name: 'Main Farm Branch',
    type: 'Layer Farm',
    createdAt: new Date().toISOString(),
    ownerUsername: 'owner'
  });

  // 4. Update all sales, eggs, invoices, batches, staff, feeds, health to canonicalWorkspaceId
  const tables = ['sales', 'eggs', 'invoices', 'batches', 'staff', 'feeds', 'health'];
  for (const table of tables) {
    // Re-assign records that were under 'main', 'main-org_owner_main', or any other legacy workspace for owner
    await supabase.from(table).update({ workspaceId: canonicalWorkspaceId }).or(`workspaceId.eq.main,workspaceId.eq.main-org_owner_main,workspaceId.eq.ws_${userId.replace(/-/g, '')}`);
  }

  // 5. Verify record counts for canonicalWorkspaceId
  const [salesCount, eggsCount, invoicesCount, staffCount, batchesCount] = await Promise.all([
    supabase.from('sales').select('count', { count: 'exact' }).eq('workspaceId', canonicalWorkspaceId),
    supabase.from('eggs').select('count', { count: 'exact' }).eq('workspaceId', canonicalWorkspaceId),
    supabase.from('invoices').select('count', { count: 'exact' }).eq('workspaceId', canonicalWorkspaceId),
    supabase.from('staff').select('count', { count: 'exact' }).eq('workspaceId', canonicalWorkspaceId),
    supabase.from('batches').select('count', { count: 'exact' }).eq('workspaceId', canonicalWorkspaceId),
  ]);

  console.log("Canonical Workspace Counts:", {
    workspaceId: canonicalWorkspaceId,
    sales: salesCount.count,
    eggs: eggsCount.count,
    invoices: invoicesCount.count,
    staff: staffCount.count,
    batches: batchesCount.count,
  });
}

fixOwnerPermanent();
