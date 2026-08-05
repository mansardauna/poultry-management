'use strict';
import { supabase } from "@/lib/supabase";
import { EnterpriseClient } from "@/components/features/enterprise/EnterpriseClient";
import { getWorkspaceId } from "@/lib/workspace";
import { cookies } from 'next/headers';

export default async function EnterprisePage() {
  const workspaceId = await getWorkspaceId();
  const cookieStore = await cookies();
  const tier = cookieStore.get('pfms_tier')?.value || 'free';

  const [workspacesRes, coopRes, apiKeysRes, consultantsRes] = await Promise.all([
    supabase.from('workspaces').select('*'),
    supabase.from('enterprise_cooperatives').select('*').eq('workspaceId', workspaceId).limit(1),
    supabase.from('enterprise_api_keys').select('*').eq('workspaceId', workspaceId),
    supabase.from('enterprise_consultants').select('*').eq('workspaceId', workspaceId)
  ]);

  return <EnterpriseClient 
    tier={tier} 
    workspaces={workspacesRes.data || []} 
    cooperative={coopRes.data?.[0]}
    apiKeys={apiKeysRes.data || []}
    consultants={consultantsRes.data || []}
  />;
}
