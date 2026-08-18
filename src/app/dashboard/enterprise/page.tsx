'use strict';
import { supabase } from "@/lib/supabase";
import { EnterpriseClient } from "@/components/features/enterprise/EnterpriseClient";
import { getWorkspaceId } from "@/lib/workspace";
import { cookies } from 'next/headers';

export default async function EnterprisePage() {
  const workspaceId = await getWorkspaceId();
  const cookieStore = await cookies();
  
  // Read authoritative subscription tier from organizations table & fallback to cookie
  const { data: firstOrg } = await supabase.from('organizations').select('subscriptionTier').limit(1).single();
  const { data: firstSys } = await supabase.from('systemSettings').select('subscriptionTier, plan').limit(1).single();

  const rawTier = firstOrg?.subscriptionTier || firstSys?.subscriptionTier || firstSys?.plan || cookieStore.get('pfms_tier')?.value || 'free';
  const normTier = (rawTier || '').toLowerCase();
  const tier = (normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus') ? 'enterprise' : (normTier === 'pro' ? 'pro' : 'free');

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
