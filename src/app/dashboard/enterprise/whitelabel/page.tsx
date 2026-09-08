'use strict';
import { supabase } from "@/lib/supabase";
import { WhiteLabelClient } from "@/components/features/enterprise/WhiteLabelClient";
import { getWorkspaceId, getTenantTier } from "@/lib/workspace";

export default async function WhiteLabelPage() {
  const workspaceId = await getWorkspaceId();
  const tier = await getTenantTier();

  const { data: coopData } = await supabase
    .from('enterprise_cooperatives')
    .select('*')
    .eq('workspaceId', workspaceId)
    .limit(1)
    .maybeSingle();

  return <WhiteLabelClient tier={tier} cooperative={coopData} />;
}
