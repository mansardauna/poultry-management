'use strict';
import { supabase } from "@/lib/supabase";
import { FeedClient } from "@/components/features/feed/FeedClient";
import type { FeedInventory, DailyFeedLog, ChickenBatch, ProcurePipeline } from "@/data/types";

import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

/** Exported function default */
export default async function FeedPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  const [feedsRaw, feedLogsRaw, batchesRaw, procurePipelineRaw] = await Promise.all([
    applyWorkspaceFilter(supabase.from('feeds').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('feedLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('batches').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('procurePipeline').select('*'), workspaceId)
  ]);
  
  const feeds = (feedsRaw.data || []) as FeedInventory[];
  const feedLogs = (feedLogsRaw.data || []) as DailyFeedLog[];
  const batches = (batchesRaw.data || []) as ChickenBatch[];
  const procurePipeline = (procurePipelineRaw.data || []) as ProcurePipeline[];

  return (
    <FeedClient 
      initialFeeds={feeds} 
      initialLogs={feedLogs} 
      batches={batches} 
      initialProcurePipeline={procurePipeline}
      role={role}
    />
  );
}
