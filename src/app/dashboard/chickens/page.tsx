'use strict';
import { supabase } from "@/lib/supabase";
import { ChickensClient } from "@/components/features/chickens/ChickensClient";
import type { ChickenBatch } from "@/data/types";

import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function ChickensPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();
  const batches = (await supabase.from('batches').select('*').eq('workspaceId', workspaceId)).data as ChickenBatch[] || [];

  return <ChickensClient initialData={batches} role={role} />;
}
