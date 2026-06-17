'use strict';
import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { EggsClient } from "@/components/features/eggs/EggsClient";
import type { EggRecord, ChickenBatch, CushionAudit, MaturationLog } from "@/data/types";

import { cookies } from 'next/headers';

/** Exported function default */
export default async function EggsPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';
  const eggs = (await db.select().from(schema.eggs)) as EggRecord[];
  const batches = (await db.select().from(schema.batches)) as ChickenBatch[];
  const cushionAudits = (await db.select().from(schema.cushionAudits)) as CushionAudit[];
  const maturationLogs = (await db.select().from(schema.maturationLogs)) as MaturationLog[];

  return (
    <EggsClient 
      initialEggs={eggs} 
      batches={batches} 
      initialCushionAudits={cushionAudits}
      initialMaturationLogs={maturationLogs}
      role={role}
    />
  );
}
