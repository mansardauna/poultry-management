'use strict';
import { supabase } from "@/lib/supabase";
import { BranchMatrixClient } from "@/components/features/enterprise/BranchMatrixClient";
import { getTenantTier, getTenantWorkspaces } from "@/lib/workspace";

export default async function BranchMatrixPage() {
  const tier = await getTenantTier();
  const workspaces = await getTenantWorkspaces();

  // Fetch real database records across all farm branches
  const [batchesRes, eggsRes, feedsRes, salesRes] = await Promise.all([
    supabase.from('batches').select('id, currentQuantity, workspaceId'),
    supabase.from('eggs').select('id, quantity, workspaceId'),
    supabase.from('feeds').select('id, quantityKg, workspaceId'),
    supabase.from('sales').select('id, totalAmount, workspaceId')
  ]);

  const batches = batchesRes.data || [];
  const eggs = eggsRes.data || [];
  const feeds = feedsRes.data || [];
  const sales = salesRes.data || [];

  const branchMetrics: Record<string, { totalBirds: number; totalEggs: number; feedStockKg: number; revenue: number }> = {};
  
  workspaces.forEach(ws => {
    branchMetrics[ws.id] = {
      totalBirds: batches.filter(b => b.workspaceId === ws.id || !b.workspaceId).reduce((acc, b) => acc + Number(b.currentQuantity || 0), 0),
      totalEggs: eggs.filter(e => e.workspaceId === ws.id || !e.workspaceId).reduce((acc, e) => acc + Number(e.quantity || 0), 0),
      feedStockKg: feeds.filter(f => f.workspaceId === ws.id || !f.workspaceId).reduce((acc, f) => acc + Number(f.quantityKg || 0), 0),
      revenue: sales.filter(s => s.workspaceId === ws.id || !s.workspaceId).reduce((acc, s) => acc + Number(s.totalAmount || 0), 0)
    };
  });

  return <BranchMatrixClient tier={tier} workspaces={workspaces} branchMetrics={branchMetrics} />;
}
