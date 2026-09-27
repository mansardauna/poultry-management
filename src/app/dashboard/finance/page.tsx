'use strict';
import { supabase } from "@/lib/supabase";
import { FinanceClient } from "@/components/features/finance/FinanceClient";
import type { Sale, Expense } from "@/data/types";

import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';
import { isRouteAllowedForRole } from '@/lib/permissions';
import { AccessDenied } from '@/components/layout/AccessDenied';

/** Exported function default */
export default async function FinancePage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';

  if (!isRouteAllowedForRole('/dashboard/finance', role)) {
    return <AccessDenied role={role} path="/dashboard/finance" />;
  }

  const workspaceId = await getWorkspaceId();

  const [salesRaw, expensesRaw] = await Promise.all([
    applyWorkspaceFilter(supabase.from('sales').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('expenses').select('*'), workspaceId)
  ]);
  const sales = (salesRaw.data || []) as Sale[];
  const expenses = (expensesRaw.data || []) as Expense[];

  return <FinanceClient initialSales={sales} initialExpenses={expenses} role={role} />;
}
