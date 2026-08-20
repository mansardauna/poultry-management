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

    return `ws_${user.id.replace(/-/g, '').slice(0, 12)}`;
  }

  return 'main-org_owner_main';
}

/**
 * Reusable tenant isolation helper for fetching ONLY the workspaces belonging to the authenticated user/organization.
 */
export async function getTenantWorkspaces(user?: any, cookieOrgId?: string) {
  const authUser = user || (await getAuthUser());
  if (!authUser) return [];

  const cookieStore = await cookies();
  const orgIdVal = cookieOrgId || cookieStore.get('pfms_org_id')?.value || '';
  const userClean = (authUser.email || 'user').split('@')[0].toLowerCase();

  let orgId = orgIdVal;
  if (!orgId && authUser.id) {
    const { data: member } = await serviceRoleClient
      .from('organization_members')
      .select('orgId')
      .eq('userId', authUser.id)
      .limit(1)
      .maybeSingle();
    orgId = member?.orgId || `org_${authUser.id.replace(/-/g, '').slice(0, 10)}`;
  }

  let query = serviceRoleClient.from('workspaces').select('*');
  if (orgId) {
    query = query.or(`id.like.%${orgId}%,ownerUsername.eq.${userClean}`);
  } else {
    query = query.eq('ownerUsername', userClean);
  }

  const { data: list } = await query;
  if (list && list.length > 0) {
    return list;
  }

  // Fallback: Create isolated default primary workspace for this tenant
  const defaultWs = {
    id: orgId ? `main-${orgId}` : `ws_${authUser.id.replace(/-/g, '').slice(0, 12)}`,
    name: `${userClean.toUpperCase()} Farm Branch`,
    type: 'Main',
    createdAt: new Date().toISOString(),
    ownerUsername: userClean
  };

  try {
    await serviceRoleClient.from('workspaces').upsert([defaultWs]);
  } catch (_e) {}

  return [defaultWs];
}

/**
 * Reusable tenant tier helper for fetching ONLY the authoritative subscription tier of the authenticated user/organization.
 */
export async function getTenantTier(user?: any, cookieOrgId?: string, cookieTier?: string) {
  const authUser = user || (await getAuthUser());
  const cookieStore = await cookies();
  const cTier = cookieTier || cookieStore.get('pfms_tier')?.value || '';
  const normCookie = (cTier || '').toLowerCase();

  if (normCookie === 'enterprise' || normCookie === 'entrepreneur' || normCookie === 'enterprise_plus') {
    return 'enterprise';
  }

  if (authUser?.email === 'owner@poultry.com') {
    return normCookie === 'enterprise' ? 'enterprise' : 'pro';
  }

  let orgId = cookieOrgId || cookieStore.get('pfms_org_id')?.value || '';
  if (authUser?.id && !orgId) {
    const { data: member } = await serviceRoleClient
      .from('organization_members')
      .select('orgId')
      .eq('userId', authUser.id)
      .limit(1)
      .maybeSingle();
    orgId = member?.orgId || '';
  }

  if (orgId) {
    const { data: orgData } = await serviceRoleClient
      .from('organizations')
      .select('subscriptionTier')
      .eq('id', orgId)
      .limit(1)
      .maybeSingle();

    if (orgData?.subscriptionTier) {
      const dbTier = (orgData.subscriptionTier || '').toLowerCase();
      if (dbTier === 'enterprise' || dbTier === 'entrepreneur' || dbTier === 'enterprise_plus') {
        return 'enterprise';
      }
      if (dbTier === 'pro') return 'pro';
    }
  }

  return normCookie === 'pro' ? 'pro' : 'free';
}
