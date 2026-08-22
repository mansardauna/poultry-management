'use strict';
import { supabase } from "@/lib/supabase";
import { BranchMatrixClient } from "@/components/features/enterprise/BranchMatrixClient";
import { getTenantTier, getTenantWorkspaces } from "@/lib/workspace";

export default async function BranchMatrixPage() {
  const tier = await getTenantTier();
  const workspaces = await getTenantWorkspaces();

  // Fetch real database records across all farm branches
  const [batchesRes, eggsRes, feedsRes, salesRes] = await Promise.all([
    supabase.from('batches').select('id, quantity, workspaceId'),
    supabase.from('eggs').select('id, quantity, workspaceId'),
    supabase.from('feeds').select('id, quantity, quantityKg, workspaceId'),
    supabase.from('sales').select('id, totalAmount, workspaceId')
  ]);

  const batches = batchesRes.data || [];
  const eggs = eggsRes.data || [];
  const feeds = feedsRes.data || [];
  const sales = salesRes.data || [];

  const branchMetrics: Record<string, { totalBirds: number; totalEggs: number; feedStockKg: number; revenue: number }> = {};
  
  workspaces.forEach((ws, idx) => {
    // If only 1 workspace exists or if ws.id matches:
    const matchWs = (itemWsId?: string) => {
      if (!itemWsId) return idx === 0;
      return itemWsId === ws.id || itemWsId.includes(ws.id) || ws.id.includes(itemWsId);
    };

    branchMetrics[ws.id] = {
      totalBirds: batches.filter(b => matchWs(b.workspaceId)).reduce((acc, b) => acc + Number(b.quantity || 0), 0),
      totalEggs: eggs.filter(e => matchWs(e.workspaceId)).reduce((acc, e) => acc + Number(e.quantity || 0), 0),
      feedStockKg: feeds.filter(f => matchWs(f.workspaceId)).reduce((acc, f) => acc + Number(f.quantityKg || f.quantity || 0), 0),
      revenue: sales.filter(s => matchWs(s.workspaceId)).reduce((acc, s) => acc + Number(s.totalAmount || 0), 0)
    };
  });

  return <BranchMatrixClient tier={tier} workspaces={workspaces} branchMetrics={branchMetrics} />;
}
