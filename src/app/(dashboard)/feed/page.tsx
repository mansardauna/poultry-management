import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { FeedClient } from "@/components/features/feed/FeedClient";
import type { FeedInventory, DailyFeedLog, ChickenBatch, ProcurePipeline } from "@/data/types";

import { cookies } from 'next/headers';

export default async function FeedPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';
  const feeds = (await db.select().from(schema.feeds)) as FeedInventory[];
  const feedLogs = (await db.select().from(schema.feedLogs)) as DailyFeedLog[];
  const batches = (await db.select().from(schema.batches)) as ChickenBatch[];
  const procurePipeline = (await db.select().from(schema.procurePipeline)) as ProcurePipeline[];

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
