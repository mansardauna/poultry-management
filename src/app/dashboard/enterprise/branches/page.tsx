'use strict';
import { supabase } from "@/lib/supabase";
import { BranchMatrixClient } from "@/components/features/enterprise/BranchMatrixClient";
import { getTenantTier, getTenantWorkspaces } from "@/lib/workspace";
import { Workspace } from "@/data/types";

interface BatchRecord {
  id: string;
  quantity?: number;
  workspaceId?: string;
}

interface EggRecord {
  id: string;
  quantity?: number;
  workspaceId?: string;
}

interface FeedRecord {
  id: string;
  quantity?: number;
  quantityKg?: number;
  workspaceId?: string;
}

interface SaleRecord {
  id: string;
  totalAmount?: number;
  workspaceId?: string;
}

export default async function BranchMatrixPage() {
  const tier = await getTenantTier();
  const rawWorkspaces = await getTenantWorkspaces();
  const workspaces: Workspace[] = (rawWorkspaces as unknown as Workspace[]) || [];

  // Isolate records strictly to the authenticated tenant's workspaces
  const workspaceIds = workspaces.map((w) => w.id).filter(Boolean);

  if (workspaceIds.length === 0) {
    return <BranchMatrixClient tier={tier} workspaces={[]} branchMetrics={{}} />;
  }

  // Fetch real database records across ONLY this tenant's farm branches
  const [batchesRes, eggsRes, feedsRes, salesRes] = await Promise.all([
    supabase.from('batches').select('id, quantity, workspaceId').in('workspaceId', workspaceIds),
    supabase.from('eggs').select('id, quantity, workspaceId').in('workspaceId', workspaceIds),
    supabase.from('feeds').select('id, quantity, quantityKg, workspaceId').in('workspaceId', workspaceIds),
    supabase.from('sales').select('id, totalAmount, workspaceId').in('workspaceId', workspaceIds)
  ]);

  const batches: BatchRecord[] = (batchesRes.data as unknown as BatchRecord[]) || [];
  const eggs: EggRecord[] = (eggsRes.data as unknown as EggRecord[]) || [];
  const feeds: FeedRecord[] = (feedsRes.data as unknown as FeedRecord[]) || [];
  const sales: SaleRecord[] = (salesRes.data as unknown as SaleRecord[]) || [];

  const branchMetrics: Record<string, { totalBirds: number; totalEggs: number; feedStockKg: number; revenue: number }> = {};
  
  workspaces.forEach((ws, idx: number) => {
    // If only 1 workspace exists or if ws.id matches:
    const matchWs = (itemWsId?: string) => {
      if (!itemWsId) return idx === 0;
      return itemWsId === ws.id || itemWsId.includes(ws.id) || ws.id.includes(itemWsId);
    };

    branchMetrics[ws.id] = {
      totalBirds: batches.filter((b) => matchWs(b.workspaceId)).reduce((acc, b) => acc + Number(b.quantity || 0), 0),
      totalEggs: eggs.filter((e) => matchWs(e.workspaceId)).reduce((acc, e) => acc + Number(e.quantity || 0), 0),
      feedStockKg: feeds.filter((f) => matchWs(f.workspaceId)).reduce((acc, f) => acc + Number(f.quantityKg || f.quantity || 0), 0),
      revenue: sales.filter((s) => matchWs(s.workspaceId)).reduce((acc, s) => acc + Number(s.totalAmount || 0), 0)
    };
  });

  return <BranchMatrixClient tier={tier} workspaces={workspaces} branchMetrics={branchMetrics} />;
}
