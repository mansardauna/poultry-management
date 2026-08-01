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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://dwjddjndeaqxlaqynjsy.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JUFRU5jxawzW5H4FyPeCqw_7plDdl0n';

const supabase = createClient(supabaseUrl, supabaseKey);

async function logData() {
  const workspaceId = 'main';
  const timestamp = Date.now();

  // 1. Expenses: 90k feed weekly for last 3 weeks (July 18, July 25, Aug 1)
  const expenses = [
    { id: `ex-${timestamp}-1`, workspaceId, date: '2026-07-18', category: 'Feed', amount: 90000, description: 'Weekly feed' },
    { id: `ex-${timestamp}-2`, workspaceId, date: '2026-07-25', category: 'Feed', amount: 90000, description: 'Weekly feed' },
    { id: `ex-${timestamp}-3`, workspaceId, date: '2026-08-01', category: 'Feed', amount: 90000, description: 'Weekly feed' }
  ];

  // 2. Eggs: Thursday (July 30) 3 crates & 7, Friday (July 31) 4 crates & 20
  const batchesRes = await supabase.from('batches').select('id').eq('workspaceId', workspaceId).limit(1);
  const batchId = batchesRes.data?.[0]?.id || 'b1';

  const eggs = [
    { id: `e-${timestamp}-1`, workspaceId, date: '2026-07-30', batchId, goodEggs: (3 * 30) + 7, brokenEggs: 0, spoiltEggs: 0 },
    { id: `e-${timestamp}-2`, workspaceId, date: '2026-07-31', batchId, goodEggs: (4 * 30) + 20, brokenEggs: 0, spoiltEggs: 0 }
  ];

  // 3. Sales: 21,500 on July 30 (5 crates), 21,500 on July 31 (5 crates)
  const sales = [
    { id: `s-${timestamp}-1`, workspaceId, date: '2026-07-30', customerName: 'Retail Buyer', type: 'Eggs', quantity: 5, totalAmount: 21500, paymentMethod: 'Cash', status: 'Paid' },
    { id: `s-${timestamp}-2`, workspaceId, date: '2026-07-31', customerName: 'Retail Buyer', type: 'Eggs', quantity: 5, totalAmount: 21500, paymentMethod: 'Cash', status: 'Paid' }
  ];

  // Insert Expenses
  const { error: expErr } = await supabase.from('expenses').insert(expenses);
  console.log("Expenses Insert:", expErr || "Success");

  // Insert Eggs
  const { error: eggErr } = await supabase.from('eggs').insert(eggs);
  console.log("Eggs Insert:", eggErr || "Success");

  // Insert Sales
  const { error: saleErr } = await supabase.from('sales').insert(sales);
  console.log("Sales Insert:", saleErr || "Success");
}

logData();
