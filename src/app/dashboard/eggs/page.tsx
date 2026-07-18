'use strict';
import { supabase } from "@/lib/supabase";
import { EggsClient } from "@/components/features/eggs/EggsClient";
import type { EggRecord, ChickenBatch, CushionAudit, MaturationLog } from "@/data/types";

import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function EggsPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  const [eggsRaw, batchesRaw, cushionAuditsRaw, maturationLogsRaw] = await Promise.all([
    supabase.from('eggs').select('*').eq('workspaceId', workspaceId),
    supabase.from('batches').select('*').eq('workspaceId', workspaceId),
    supabase.from('cushionAudits').select('*').eq('workspaceId', workspaceId),
    supabase.from('maturationLogs').select('*').eq('workspaceId', workspaceId)
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
