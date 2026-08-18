'use strict';
import { supabase } from "@/lib/supabase";
import { VetHotlineClient } from "@/components/features/enterprise/VetHotlineClient";
import { getWorkspaceId } from "@/lib/workspace";
import { cookies } from 'next/headers';

export default async function VetHotlinePage() {
  const workspaceId = await getWorkspaceId();
  const cookieStore = await cookies();

  const { data: firstOrg } = await supabase.from('organizations').select('subscriptionTier').limit(1).single();
  const { data: firstSys } = await supabase.from('systemSettings').select('subscriptionTier, plan').limit(1).single();

  const rawTier = firstOrg?.subscriptionTier || firstSys?.subscriptionTier || firstSys?.plan || cookieStore.get('pfms_tier')?.value || 'free';
  const normTier = (rawTier || '').toLowerCase();
  const tier = (normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus') ? 'enterprise' : (normTier === 'pro' ? 'pro' : 'free');

  const { data: consultants } = await supabase
    .from('enterprise_consultants')
    .select('*')
    .eq('workspaceId', workspaceId);

  return <VetHotlineClient tier={tier} consultants={consultants || []} />;
}
