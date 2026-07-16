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

  const [eggsRaw, batchesRaw, cushionAuditsRaw, maturationLogsRaw] = await Promise.all([
    db.select().from(schema.eggs),
    db.select().from(schema.batches),
    db.select().from(schema.cushionAudits),
    db.select().from(schema.maturationLogs)
  ]);
  const eggs = eggsRaw as EggRecord[];
  const batches = batchesRaw as ChickenBatch[];
  const cushionAudits = cushionAuditsRaw as CushionAudit[];
  const maturationLogs = maturationLogsRaw as MaturationLog[];

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
