'use strict';
import { supabase } from "@/lib/supabase";
import { SalesClient } from "@/components/features/sales/SalesClient";
import type { Sale, Invoice, ChickenBatch } from "@/data/types";
import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function SalesPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  const [salesRaw, invoicesRaw, batchesRaw] = await Promise.all([
    supabase.from('sales').select('*').eq('workspaceId', workspaceId),
    supabase.from('invoices').select('*').eq('workspaceId', workspaceId),
    supabase.from('batches').select('*').eq('workspaceId', workspaceId)
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
