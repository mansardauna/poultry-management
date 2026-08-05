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
  const orgIdCookie = cookieStore.get('pfms_org_id')?.value;

  if (workspaceCookie && workspaceCookie !== 'main') {
    return workspaceCookie;
  }

  if (orgIdCookie) {
    return `main-${orgIdCookie}`;
  }

  const user = await getAuthUser();
  if (user?.id) {
    // Retrieve authenticated user's organization from database
    const { data: memberData } = await serviceRoleClient
      .from('organization_members')
      .select('orgId')
      .eq('userId', user.id)
      .limit(1)
      .single();

    if (memberData?.orgId) {
      return `main-${memberData.orgId}`;
    }

    return `ws_${user.id.replace(/-/g, '')}`;
  }

  return 'ws_demo';
}
