'use strict';
import { supabase } from "@/lib/supabase";
import { EnterpriseClient } from "@/components/features/enterprise/EnterpriseClient";
import { getWorkspaceId } from "@/lib/workspace";
import { cookies } from 'next/headers';

export default async function EnterprisePage() {
  const workspaceId = await getWorkspaceId();
  const cookieStore = await cookies();
  const tier = cookieStore.get('pfms_tier')?.value || 'free';

  const workspaces = (await supabase.from('workspaces').select('*')).data || [];

  return <EnterpriseClient tier={tier} workspaces={workspaces} />;
}
