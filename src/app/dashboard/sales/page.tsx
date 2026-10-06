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
  const sales = (salesRaw.data || []).map((s: Record<string, unknown>) => ({
    id: String(s.id),
    date: (s.date as string) || new Date().toISOString().split('T')[0],
    type: (s.type as string) || 'Eggs',
    quantity: Number(s.quantity) || 0,
    totalAmount: Number(s.totalAmount) || 0,
    customerName: (s.customerName as string) || 'Walk-in Customer',
    paymentMethod: (s.paymentMethod as string) || 'Cash',
    status: (s.status as string) || 'Paid'
  })) as Sale[];

  const invoices = (invoicesRaw.data || []).map((i: Record<string, unknown>) => ({
    id: String(i.id),
    date: (i.date as string) || new Date().toISOString().split('T')[0],
    saleId: String(i.saleId || ''),
    customerName: (i.customerName as string) || 'Customer Invoice',
    items: (i.items as string) || 'Poultry Products',
    quantity: Number(i.quantity) || 0,
    unitPrice: Number(i.unitPrice) || 0,
    totalAmount: Number(i.totalAmount) || 0,
    status: (i.status as string) || 'Unpaid'
  })) as Invoice[];

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
