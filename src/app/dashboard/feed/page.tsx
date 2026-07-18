'use strict';
import { supabase } from "@/lib/supabase";
import { FeedClient } from "@/components/features/feed/FeedClient";
import type { FeedInventory, DailyFeedLog, ChickenBatch, ProcurePipeline } from "@/data/types";

import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function FeedPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  const [feedsRaw, feedLogsRaw, batchesRaw, procurePipelineRaw] = await Promise.all([
    supabase.from('feeds').select('*').eq('workspaceId', workspaceId),
    supabase.from('feedLogs').select('*').eq('workspaceId', workspaceId),
    supabase.from('batches').select('*').eq('workspaceId', workspaceId),
    supabase.from('procurePipeline').select('*').eq('workspaceId', workspaceId)
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
