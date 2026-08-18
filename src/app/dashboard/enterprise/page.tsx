'use strict';
import { supabase } from "@/lib/supabase";
import { EnterpriseClient } from "@/components/features/enterprise/EnterpriseClient";
import { getWorkspaceId } from "@/lib/workspace";
import { cookies } from 'next/headers';

export default async function EnterprisePage() {
  const workspaceId = await getWorkspaceId();
  const cookieStore = await cookies();
  
  // Read authoritative subscription tier from organizations table & fallback to cookie
  const { data: firstOrg } = await supabase.from('organizations').select('subscriptionTier').limit(1).single();
  const { data: firstSys } = await supabase.from('systemSettings').select('subscriptionTier, plan').limit(1).single();

  const rawTier = firstOrg?.subscriptionTier || firstSys?.subscriptionTier || firstSys?.plan || cookieStore.get('pfms_tier')?.value || 'free';
  const normTier = (rawTier || '').toLowerCase();
  const tier = (normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus') ? 'enterprise' : (normTier === 'pro' ? 'pro' : 'free');

  // Fetch real data from database across all branches with zero demo data!
  const [workspacesRes, coopRes, apiKeysRes, consultantsRes, bulkOrdersRes, batchesRes, eggsRes, feedsRes, salesRes] = await Promise.all([
    supabase.from('workspaces').select('*'),
    supabase.from('enterprise_cooperatives').select('*').eq('workspaceId', workspaceId).limit(1),
    supabase.from('enterprise_api_keys').select('*').eq('workspaceId', workspaceId),
    supabase.from('enterprise_consultants').select('*').eq('workspaceId', workspaceId),
    supabase.from('enterprise_bulk_orders').select('*').eq('workspaceId', workspaceId),
    supabase.from('batches').select('id, currentQuantity, workspaceId'),
    supabase.from('eggs').select('id, quantity, workspaceId'),
    supabase.from('feeds').select('id, quantityKg, workspaceId'),
    supabase.from('sales').select('id, totalAmount, workspaceId')
  ]);

  const workspaces = workspacesRes.data || [];
  const batches = batchesRes.data || [];
  const eggs = eggsRes.data || [];
  const feeds = feedsRes.data || [];
  const sales = salesRes.data || [];

  // Compute real aggregated stats per branch
  const branchMetrics: Record<string, { totalBirds: number; totalEggs: number; feedStockKg: number; revenue: number }> = {};
  
  workspaces.forEach(ws => {
    branchMetrics[ws.id] = {
      totalBirds: batches.filter(b => b.workspaceId === ws.id || !b.workspaceId).reduce((acc, b) => acc + Number(b.currentQuantity || 0), 0),
      totalEggs: eggs.filter(e => e.workspaceId === ws.id || !e.workspaceId).reduce((acc, e) => acc + Number(e.quantity || 0), 0),
      feedStockKg: feeds.filter(f => f.workspaceId === ws.id || !f.workspaceId).reduce((acc, f) => acc + Number(f.quantityKg || 0), 0),
      revenue: sales.filter(s => s.workspaceId === ws.id || !s.workspaceId).reduce((acc, s) => acc + Number(s.totalAmount || 0), 0)
    };
  });

  return <EnterpriseClient 
    tier={tier} 
    workspaces={workspaces} 
    branchMetrics={branchMetrics}
    cooperative={coopRes.data?.[0]}
    apiKeys={apiKeysRes.data || []}
    consultants={consultantsRes.data || []}
    bulkOrders={bulkOrdersRes.data || []}
  />;
}
