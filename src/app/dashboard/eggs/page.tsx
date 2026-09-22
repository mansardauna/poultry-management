'use strict';
import { supabase } from "@/lib/supabase";
import { EggsClient } from "@/components/features/eggs/EggsClient";
import type { EggRecord, ChickenBatch, CushionAudit, MaturationLog } from "@/data/types";

import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

/** Exported function default */
export default async function EggsPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  const [eggsRaw, batchesRaw, cushionAuditsRaw, maturationLogsRaw] = await Promise.all([
    applyWorkspaceFilter(supabase.from('eggs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('batches').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('cushionAudits').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('maturationLogs').select('*'), workspaceId)
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
