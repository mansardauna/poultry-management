'use strict';
import { supabase } from "@/lib/supabase";
import { FeedPoolClient } from "@/components/features/enterprise/FeedPoolClient";
import { getWorkspaceId, getTenantTier } from "@/lib/workspace";

export default async function FeedPoolPage() {
  const workspaceId = await getWorkspaceId();
  const tier = await getTenantTier();

  const { data: bulkOrders } = await supabase
    .from('enterprise_bulk_orders')
    .select('*')
    .eq('workspaceId', workspaceId);

  return <FeedPoolClient tier={tier} bulkOrders={bulkOrders || []} />;
}
