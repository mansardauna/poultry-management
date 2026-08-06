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

async function testPayInvoicePage() {
  console.log("Testing invoice lookup in Supabase...");

  // Fetch the latest invoice from Supabase
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .limit(5);

  console.log("Invoice Lookup Error:", invError);
  console.log("Invoices found:", invoices ? invoices.map(i => ({ id: i.id, customerName: i.customerName, status: i.status })) : []);

  if (invoices && invoices.length > 0) {
    const testInv = invoices[0];
    console.log(`\nTesting lookup for single invoice id '${testInv.id}'...`);
    const { data: singleInv, error: singleErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', testInv.id)
      .limit(1)
      .single();

    console.log("Single lookup error:", singleErr);
    console.log("Found single invoice:", singleInv);
  }
}

testPayInvoicePage();
