'use strict';
import { supabase } from "@/lib/supabase";
import { SalesClient } from "@/components/features/sales/SalesClient";
import type { Sale, Invoice, ChickenBatch } from "@/data/types";
import { cookies } from 'next/headers';

/** Exported function default */
export default async function SalesPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('pfms_auth')?.value || 'Staff';

  const [salesRaw, invoicesRaw, batchesRaw] = await Promise.all([
    supabase.from('sales').select('*'),
    supabase.from('invoices').select('*'),
    supabase.from('batches').select('*')
  ]);
  const sales = (salesRaw.data || []) as Sale[];
  const invoices = (invoicesRaw.data || []) as Invoice[];
  const batches = (batchesRaw.data || []) as ChickenBatch[];

  return (
    <SalesClient 
      initialSales={sales} 
      initialInvoices={invoices}
      batches={batches}
      role={role}
    />
  );
}
