'use strict';

import { cookies } from 'next/headers';
import { getAuthUser } from './auth';
import { supabase as serviceRoleClient } from './supabase';

/**
 * Get the current workspace ID strictly isolated per organization / user.
 */
export async function getWorkspaceId(): Promise<string> {
  const cookieStore = await cookies();
  const workspaceCookie = cookieStore.get('pfms_workspace')?.value;

  const user = await getAuthUser();

  if (user?.email === 'owner@poultry.com') {
    if (workspaceCookie && workspaceCookie.includes('org_owner_main')) {
      return workspaceCookie;
    }
    return 'main-org_owner_main';
  }

  if (user?.id) {
    // Retrieve authenticated user's organization from database
    const { data: memberData } = await serviceRoleClient
      .from('organization_members')
      .select('orgId')
      .eq('userId', user.id)
      .limit(1)
      .single();

    if (memberData?.orgId) {
      if (workspaceCookie && workspaceCookie.includes(memberData.orgId)) {
        return workspaceCookie;
      }
      return `main-${memberData.orgId}`;
    }

    return `ws_${user.id.replace(/-/g, '')}`;
  }

  return workspaceCookie || 'ws_demo';
}
