const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || 'https://dwjddjndeaqxlaqynjsy.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JUFRU5jxawzW5H4FyPeCqw_7plDdl0n'
);

async function test() {
  const workspaceId = 'main';
  
  // Test deleting and inserting alert settings
  console.log('Deleting alertSettings...');
  const { error: delErr } = await supabase.from('alertSettings').delete().eq('workspaceId', workspaceId);
  console.log('Delete Error:', delErr);

  const newSettings = {
    workspaceId,
    feedThresholdKg: 100,
    eggDropPercentage: 20,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true
  };
  
  console.log('Inserting alertSettings...');
  const { error: insErr } = await supabase.from('alertSettings').insert([newSettings]);
  console.log('Insert Error:', insErr);

  // Test System Settings
  console.log('Deleting systemSettings...');
  const { error: sysDelErr } = await supabase.from('systemSettings').delete().eq('workspaceId', workspaceId);
  console.log('Sys Delete Error:', sysDelErr);

  const sysSettings = {
    id: 'sys-1234',
    workspaceId,
    eggCratePriceSmall: 5000,
    eggCratePriceLarge: 5500,
    adminName: 'Test Admin',
    adminEmail: 'test@admin.com',
    adminPhone: '1234'
  };

  console.log('Inserting systemSettings...');
  const { error: sysInsErr } = await supabase.from('systemSettings').insert([sysSettings]);
  console.log('Sys Insert Error:', sysInsErr);
}

test();
