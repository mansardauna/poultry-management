'use strict';
import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { FeedClient } from "@/components/features/feed/FeedClient";
import type { FeedInventory, DailyFeedLog, ChickenBatch, ProcurePipeline } from "@/data/types";

import { cookies } from 'next/headers';

/** Exported function default */
export default async function FeedPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';

  const [feedsRaw, feedLogsRaw, batchesRaw, procurePipelineRaw] = await Promise.all([
    db.select().from(schema.feeds),
    db.select().from(schema.feedLogs),
    db.select().from(schema.batches),
    db.select().from(schema.procurePipeline)
  ]);
  
  const feeds = feedsRaw as FeedInventory[];
  const feedLogs = feedLogsRaw as DailyFeedLog[];
  const batches = batchesRaw as ChickenBatch[];
  const procurePipeline = procurePipelineRaw as ProcurePipeline[];

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
