'use strict';
import { supabase } from "@/lib/supabase";
import { SalesClient } from "@/components/features/sales/SalesClient";
import type { Sale, Invoice, ChickenBatch } from "@/data/types";
import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

/** Exported function default */
export default async function SalesPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  const [salesRaw, invoicesRaw, batchesRaw] = await Promise.all([
    applyWorkspaceFilter(supabase.from('sales').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('invoices').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('batches').select('*'), workspaceId)
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
