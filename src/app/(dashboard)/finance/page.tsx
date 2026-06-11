import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { FinanceClient } from "@/components/features/finance/FinanceClient";
import type { Sale, Expense } from "@/data/types";

import { cookies } from 'next/headers';

export default async function FinancePage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('pfms_auth')?.value || 'Staff';
  const sales = (await db.select().from(schema.sales)) as Sale[];
  const expenses = (await db.select().from(schema.expenses)) as Expense[];

  return <FinanceClient initialSales={sales} initialExpenses={expenses} role={role} />;
}
