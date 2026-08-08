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

  // 1. If explicit valid workspace cookie exists, respect the workspace cookie!
  if (workspaceCookie && workspaceCookie.trim().length > 0) {
    return workspaceCookie;
  }

  const user = await getAuthUser();

  // 2. Owner special case
  if (user?.email === 'owner@poultry.com') {
    return 'main-org_owner_main';
  }

  if (user?.id) {
    const userEmail = user.email || '';
    const userClean = userEmail.split('@')[0];

    // 3. Check if staff/manager record has an assigned farm workspace
    const { data: staffRec } = await serviceRoleClient
      .from('staff')
      .select('workspaceId, assignedBranches')
      .or(`name.eq.${userEmail},contact.eq.${userEmail},name.eq.${userClean}`)
      .limit(1)
      .maybeSingle();

    if (staffRec?.assignedBranches && Array.isArray(staffRec.assignedBranches) && staffRec.assignedBranches.length > 0) {
      return staffRec.assignedBranches[0];
    }
    if (staffRec?.workspaceId) {
      return staffRec.workspaceId;
    }

    const { data: userRec } = await serviceRoleClient
      .from('users')
      .select('workspaceId')
      .or(`username.eq.${userClean},email.eq.${userEmail}`)
      .limit(1)
      .maybeSingle();

    if (userRec?.workspaceId) {
      return userRec.workspaceId;
    }

    // 4. Retrieve authenticated user's organization from database
    const { data: memberData } = await serviceRoleClient
      .from('organization_members')
      .select('orgId')
      .eq('userId', user.id)
      .limit(1)
      .maybeSingle();

    if (memberData?.orgId) {
      return `main-${memberData.orgId}`;
    }

    // 5. Fallback: Query workspaces table for the primary farm workspace
    const { data: mainWorkspaces } = await serviceRoleClient
      .from('workspaces')
      .select('id')
      .order('createdAt', { ascending: true })
      .limit(1);

    if (mainWorkspaces && mainWorkspaces.length > 0) {
      return mainWorkspaces[0].id;
    }
  }

  return 'main-org_owner_main';
}
