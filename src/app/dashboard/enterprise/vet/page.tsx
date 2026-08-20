'use strict';
import { supabase } from "@/lib/supabase";
import { VetHotlineClient } from "@/components/features/enterprise/VetHotlineClient";
import { getWorkspaceId, getTenantTier } from "@/lib/workspace";

export default async function VetHotlinePage() {
  const workspaceId = await getWorkspaceId();
  const tier = await getTenantTier();

  const { data: consultants } = await supabase
    .from('enterprise_consultants')
    .select('*')
    .eq('workspaceId', workspaceId);

  return <VetHotlineClient tier={tier} consultants={consultants || []} />;
}
