import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://dwjddjndeaqxlaqynjsy.supabase.co';
const supabaseKey = 'sb_publishable_JUFRU5jxawzW5H4FyPeCqw_7plDdl0n';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const dates = [
    { date: '2026-07-10', eggs: 99, sales: 12 }, // Friday
    { date: '2026-07-11', eggs: 127, sales: 0 }, // Saturday
    { date: '2026-07-12', eggs: 135, sales: 0 }, // Sunday
    { date: '2026-07-13', eggs: 147, sales: 11 }, // Monday
    { date: '2026-07-14', eggs: 150, sales: 0 }, // Tuesday
    { date: '2026-07-15', eggs: 148, sales: 0 }, // Wednesday
    { date: '2026-07-16', eggs: 144, sales: 2 }, // Thursday
  ];

  const eggInserts = dates.map(d => ({
    id: crypto.randomUUID(),
    workspaceId: 'main',
    date: d.date,
    goodEggs: d.eggs,
    brokenEggs: 0,
    spoiltEggs: 0,
    batchId: 'batch-1'
  }));

  const feedInserts = dates.map(d => ({
    id: crypto.randomUUID(),
    workspaceId: 'main',
    date: d.date,
    feedId: 'feed-1',
    quantityConsumedKg: 35,
    batchId: 'batch-1'
  }));

  const saleInserts = dates.filter(d => d.sales > 0).map(d => ({
    id: crypto.randomUUID(),
    workspaceId: 'main',
    date: d.date,
    type: 'Eggs',
    quantity: d.sales * 30, // saving sales in pieces for consistency, or crates? The schema expects quantity as integer, let's use pieces.
    totalAmount: d.sales * 4200,
    customerName: 'Retail Customer',
    paymentMethod: 'Cash',
    status: 'Completed'
  }));

  console.log('Inserting Eggs...');
  const { error: eErr } = await supabase.from('eggs').insert(eggInserts);
  if(eErr) console.error(eErr);

  console.log('Inserting Feeds...');
  const { error: fErr } = await supabase.from('feedLogs').insert(feedInserts);
  if(fErr) console.error(fErr);

  console.log('Inserting Sales...');
  const { error: sErr } = await supabase.from('sales').insert(saleInserts);
  if(sErr) console.error(sErr);

  console.log('Finished logging all data!');
}

seed();
