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

async function testCreateInvoice() {
  console.log("Testing invoice creation with non-null saleId...");

  const workspaceId = 'main-org_owner_main';
  const invId = 'inv' + Date.now().toString().slice(-8);
  const saleId = 'sa' + Date.now().toString().slice(-8);

  const newInvoice = {
    id: invId,
    workspaceId,
    date: new Date().toISOString().split('T')[0],
    saleId: saleId,
    customerName: 'Maitama Test Customer',
    items: '50 Crates of Large Eggs',
    quantity: 50,
    unitPrice: 4400,
    totalAmount: 220000,
    status: 'Unpaid'
  };

  const { data, error } = await supabase.from('invoices').insert([newInvoice]).select();

  if (error) {
    console.error("ERROR inserting invoice:", error);
  } else {
    console.log("SUCCESSFULLY inserted invoice into Supabase!", data);
  }
}

testCreateInvoice();
