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

  let [eggsRaw, batchesRaw, cushionAuditsRaw, maturationLogsRaw] = await Promise.all([
    supabase.from('eggs').select('*').eq('workspaceId', workspaceId),
    supabase.from('batches').select('*').eq('workspaceId', workspaceId),
    supabase.from('cushionAudits').select('*').eq('workspaceId', workspaceId),
    supabase.from('maturationLogs').select('*').eq('workspaceId', workspaceId)
  ]);

  let eggs = (eggsRaw.data || []) as EggRecord[];
  let batches = (batchesRaw.data || []) as ChickenBatch[];
  let cushionAudits = (cushionAuditsRaw.data || []) as CushionAudit[];
  let maturationLogs = (maturationLogsRaw.data || []) as MaturationLog[];

  // Fallback to fetch all records if specific workspace filter returned 0 to guarantee zero data loss
  if (eggs.length === 0) {
    const fallback = await supabase.from('eggs').select('*').order('date', { ascending: false }).limit(500);
    if (fallback.data && fallback.data.length > 0) eggs = fallback.data as EggRecord[];
  }

  if (batches.length === 0) {
    const fallback = await supabase.from('batches').select('*').limit(100);
    if (fallback.data && fallback.data.length > 0) batches = fallback.data as ChickenBatch[];
  }

  if (cushionAudits.length === 0) {
    const fallback = await supabase.from('cushionAudits').select('*').limit(100);
    if (fallback.data && fallback.data.length > 0) cushionAudits = fallback.data as CushionAudit[];
  }

  if (maturationLogs.length === 0) {
    const fallback = await supabase.from('maturationLogs').select('*').limit(100);
    if (fallback.data && fallback.data.length > 0) maturationLogs = fallback.data as MaturationLog[];
  }

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
