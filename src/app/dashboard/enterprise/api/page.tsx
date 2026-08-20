'use strict';
import { supabase } from "@/lib/supabase";
import { ApiKeysClient } from "@/components/features/enterprise/ApiKeysClient";
import { getWorkspaceId, getTenantTier } from "@/lib/workspace";

export default async function ApiKeysPage() {
  const workspaceId = await getWorkspaceId();
  const tier = await getTenantTier();

  const { data: apiKeys } = await supabase
    .from('enterprise_api_keys')
    .select('*')
    .eq('workspaceId', workspaceId);

  return <ApiKeysClient tier={tier} apiKeys={apiKeys || []} />;
}
