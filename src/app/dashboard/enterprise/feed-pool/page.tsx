'use strict';
import { supabase } from "@/lib/supabase";
import { FeedPoolClient } from "@/components/features/enterprise/FeedPoolClient";
import { getWorkspaceId } from "@/lib/workspace";
import { cookies } from 'next/headers';

export default async function FeedPoolPage() {
  const workspaceId = await getWorkspaceId();
  const cookieStore = await cookies();

  const { data: firstOrg } = await supabase.from('organizations').select('subscriptionTier').limit(1).single();
  const { data: firstSys } = await supabase.from('systemSettings').select('subscriptionTier, plan').limit(1).single();

  const rawTier = firstOrg?.subscriptionTier || firstSys?.subscriptionTier || firstSys?.plan || cookieStore.get('pfms_tier')?.value || 'free';
  const normTier = (rawTier || '').toLowerCase();
  const tier = (normTier === 'enterprise' || normTier === 'entrepreneur' || normTier === 'enterprise_plus') ? 'enterprise' : (normTier === 'pro' ? 'pro' : 'free');

  const { data: bulkOrders } = await supabase
    .from('enterprise_bulk_orders')
    .select('*')
    .eq('workspaceId', workspaceId);

  return <FeedPoolClient tier={tier} bulkOrders={bulkOrders || []} />;
}
