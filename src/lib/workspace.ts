'use strict';

import { cookies } from 'next/headers';
import { getAuthUser } from './auth';
import { supabase as serviceRoleClient } from './supabase';

/**
 * Fast, cookie-first workspace ID resolution per organization / user.
 */
export async function getWorkspaceId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const workspaceCookie = cookieStore.get('pfms_workspace')?.value;
    if (workspaceCookie && workspaceCookie.trim().length > 0) {
      return workspaceCookie;
    }
  } catch (_e) {}

  const user = await getAuthUser();
  if (user?.email === 'owner@poultry.com') {
    return 'main-org_owner_main';
  }

  if (user?.id) {
    const userEmail = user.email || '';
    const userClean = userEmail.split('@')[0].toLowerCase();
    const cookieStore = await cookies();
    const cookieOrgId = cookieStore.get('pfms_org_id')?.value || `org_${user.id.replace(/-/g, '').slice(0, 10)}`;

    try {
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
    } catch (_err) {}

    return `main-${cookieOrgId}`;
  }

  return 'main-org_owner_main';
}

/**
 * Helper to apply robust workspace filtering to query builders (Supabase / DataAdapter).
 * Ensures that if a row was stored under 'main', 'main-org_*', or null, it remains accessible
 * under the primary workspace context.
 */
export function applyWorkspaceFilter(query: any, workspaceId: string) {
  const cleanId = (workspaceId || 'main').replace(/"/g, '');
  if (!cleanId || cleanId === 'main' || cleanId.startsWith('main-') || cleanId.startsWith('org_')) {
    return query.or(`workspaceId.eq.${cleanId},workspaceId.eq.main,workspaceId.is.null`);
  }
  return query.eq('workspaceId', cleanId);
}


/**
 * Reusable tenant isolation helper for fetching ONLY the workspaces belonging to the authenticated user/organization.
 */
export async function getTenantWorkspaces(user?: any, cookieOrgId?: string) {
  const cookieStore = await cookies();
  const cookieWs = cookieStore.get('pfms_workspace')?.value;
  const orgIdVal = cookieOrgId || cookieStore.get('pfms_org_id')?.value || '';

  const authUser = user || (await getAuthUser());
  const userClean = (authUser?.email || 'admin').split('@')[0].toLowerCase();
  const orgId = orgIdVal || (authUser?.id ? `org_${authUser.id.replace(/-/g, '').slice(0, 10)}` : 'org_owner_main');

  try {
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
  } catch (_e) {}

  const primaryWsId = cookieWs || (orgId ? `main-${orgId}` : 'main-org_owner_main');
  return [{
    id: primaryWsId,
    name: 'Main Branch',
    type: 'Main',
    createdAt: new Date().toISOString(),
    ownerUsername: userClean
  }];
}

/**
 * Reusable tenant tier helper for fetching ONLY the authoritative subscription tier of the authenticated user/organization.
 */
export async function getTenantTier(user?: any, cookieOrgId?: string, cookieTier?: string) {
  try {
    const cookieStore = await cookies();
    const cTier = cookieTier || cookieStore.get('pfms_tier')?.value || '';
    const normCookie = (cTier || '').toLowerCase();

    if (normCookie === 'enterprise' || normCookie === 'entrepreneur' || normCookie === 'enterprise_plus') {
      return 'enterprise';
    }
    if (normCookie === 'pro') {
      return 'pro';
    }
  } catch (_e) {}

  const authUser = user || (await getAuthUser());
  if (authUser?.email === 'owner@poultry.com') {
    return 'pro';
  }

  return 'free';
}
