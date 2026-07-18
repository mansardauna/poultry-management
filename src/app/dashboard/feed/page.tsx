'use strict';
import { supabase } from "@/lib/supabase";
import { FeedClient } from "@/components/features/feed/FeedClient";
import type { FeedInventory, DailyFeedLog, ChickenBatch, ProcurePipeline } from "@/data/types";

import { cookies } from 'next/headers';

/** Exported function default */
export default async function FeedPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';

  const [feedsRaw, feedLogsRaw, batchesRaw, procurePipelineRaw] = await Promise.all([
    supabase.from('feeds').select('*'),
    supabase.from('feedLogs').select('*'),
    supabase.from('batches').select('*'),
    supabase.from('procurePipeline').select('*')
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
