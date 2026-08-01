const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function logData() {
  const workspaceId = 'main';
  const sale1 = {
    id: 's-' + Date.now() + '-1',
    workspaceId,
    date: '2026-07-26',
    customerName: 'Retail Buyer',
    type: 'Eggs',
    quantity: 12,
    totalAmount: 12 * 4300, // 51600 (43k paid on 26th, remainder on 28th)
    paymentMethod: 'Cash',
    status: 'Paid'
  };

  const sale2 = {
    id: 's-' + Date.now() + '-2',
    workspaceId,
    date: '2026-07-24',
    customerName: 'Retail Buyer',
    type: 'Eggs',
    quantity: 5, // 21000 / 4200 = 5 crates
    totalAmount: 21000,
    paymentMethod: 'Cash',
    status: 'Paid'
  };

  const { error: sale1Err } = await supabase.from('sales').insert([sale1]);
  console.log("Sale 1 Insert:", sale1Err || "Success");

  const { error: sale2Err } = await supabase.from('sales').insert([sale2]);
  console.log("Sale 2 Insert:", sale2Err || "Success");
}

logData();
