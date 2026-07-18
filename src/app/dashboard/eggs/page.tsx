'use strict';
import { supabase } from "@/lib/supabase";
import { EggsClient } from "@/components/features/eggs/EggsClient";
import type { EggRecord, ChickenBatch, CushionAudit, MaturationLog } from "@/data/types";

import { cookies } from 'next/headers';

/** Exported function default */
export default async function EggsPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';

  const [eggsRaw, batchesRaw, cushionAuditsRaw, maturationLogsRaw] = await Promise.all([
    supabase.from('eggs').select('*'),
    supabase.from('batches').select('*'),
    supabase.from('cushionAudits').select('*'),
    supabase.from('maturationLogs').select('*')
  ]);
  const eggs = (eggsRaw.data || []) as EggRecord[];
  const batches = (batchesRaw.data || []) as ChickenBatch[];
  const cushionAudits = (cushionAuditsRaw.data || []) as CushionAudit[];
  const maturationLogs = (maturationLogsRaw.data || []) as MaturationLog[];

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
