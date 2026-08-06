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

async function testSyncInvoiceSale() {
  console.log("Checking unpaid invoices and sales...");
  const workspaceId = 'main-org_owner_main';

  // 1. Fetch unpaid invoice
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('workspaceId', workspaceId)
    .eq('status', 'Unpaid');

  console.log("Unpaid invoices:", invoices);

  if (invoices && invoices.length > 0) {
    const targetInv = invoices[0];
    console.log("Simulating marking unpaid invoice as Paid:", targetInv.id);

    // Update invoice status to Paid
    await supabase.from('invoices').update({ status: 'Paid' }).eq('id', targetInv.id);

    // Sync to sales table
    const targetSaleId = targetInv.saleId || ('sa' + Date.now().toString().slice(-8));
    const { data: existingSales } = await supabase.from('sales').select('*').eq('id', targetSaleId);

    if (!existingSales || existingSales.length === 0) {
      console.log("Creating new sale record for paid invoice...");
      const newSale = {
        id: targetSaleId,
        workspaceId: targetInv.workspaceId,
        date: targetInv.date || new Date().toISOString().split('T')[0],
        type: targetInv.items?.toLowerCase().includes('chicken') ? 'Chickens' : 'Eggs',
        quantity: targetInv.quantity || 1,
        totalAmount: targetInv.totalAmount || 0,
        customerName: targetInv.customerName || 'Invoice Customer',
        paymentMethod: 'Paystack / Online Gateway',
        status: 'Paid'
      };

      const { data: insertedSale, error: saleErr } = await supabase.from('sales').insert([newSale]).select();
      console.log("Sale insert result:", insertedSale, "Error:", saleErr);
    } else {
      console.log("Updating existing sale record status to Paid...");
      await supabase.from('sales').update({ status: 'Paid' }).eq('id', targetSaleId);
    }

    // Verify sales count
    const { data: allSales } = await supabase.from('sales').select('*').eq('workspaceId', workspaceId);
    console.log("All sales count after sync:", allSales ? allSales.length : 0);
  }
}

testSyncInvoiceSale();
