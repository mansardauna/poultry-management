import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { SalesClient } from "@/components/features/sales/SalesClient";
import type { Sale, Invoice, ChickenBatch } from "@/data/types";
import { cookies } from 'next/headers';

export default async function SalesPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('pfms_auth')?.value || 'Staff';
  const sales = (await db.select().from(schema.sales)) as Sale[];
  const invoices = (await db.select().from(schema.invoices)) as Invoice[];
  const batches = (await db.select().from(schema.batches)) as ChickenBatch[];

  return (
    <SalesClient 
      initialSales={sales} 
      initialInvoices={invoices}
      batches={batches}
      role={role}
    />
  );
}
