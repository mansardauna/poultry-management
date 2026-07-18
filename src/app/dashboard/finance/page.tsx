'use strict';
import { supabase } from "@/lib/supabase";
import { FinanceClient } from "@/components/features/finance/FinanceClient";
import type { Sale, Expense } from "@/data/types";

import { cookies } from 'next/headers';

/** Exported function default */
export default async function FinancePage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('pfms_auth')?.value || 'Staff';

  const [salesRaw, expensesRaw] = await Promise.all([
    supabase.from('sales').select('*'),
    supabase.from('expenses').select('*')
  ]);
  const sales = (salesRaw.data || []) as Sale[];
  const expenses = (expensesRaw.data || []) as Expense[];

  return <FinanceClient initialSales={sales} initialExpenses={expenses} role={role} />;
}
