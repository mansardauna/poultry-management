'use strict';
import { supabase } from "@/lib/supabase";
import { FinanceClient } from "@/components/features/finance/FinanceClient";
import type { Sale, Expense } from "@/data/types";

import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function FinancePage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  const [salesRaw, expensesRaw] = await Promise.all([
    supabase.from('sales').select('*').eq('workspaceId', workspaceId),
    supabase.from('expenses').select('*').eq('workspaceId', workspaceId)
  ]);
  const sales = (salesRaw.data || []) as Sale[];
  const expenses = (expensesRaw.data || []) as Expense[];

  return <FinanceClient initialSales={sales} initialExpenses={expenses} role={role} />;
}
