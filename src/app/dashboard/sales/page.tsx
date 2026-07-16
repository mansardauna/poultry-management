'use strict';
import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { SalesClient } from "@/components/features/sales/SalesClient";
import type { Sale, Invoice, ChickenBatch } from "@/data/types";
import { cookies } from 'next/headers';

/** Exported function default */
export default async function SalesPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('pfms_auth')?.value || 'Staff';

  const [salesRaw, invoicesRaw, batchesRaw] = await Promise.all([
    db.select().from(schema.sales),
    db.select().from(schema.invoices),
    db.select().from(schema.batches)
  ]);
  const sales = salesRaw as Sale[];
  const invoices = invoicesRaw as Invoice[];
  const batches = batchesRaw as ChickenBatch[];

  return (
    <SalesClient 
      initialSales={sales} 
      initialInvoices={invoices}
      batches={batches}
      role={role}
    />
  );
}
