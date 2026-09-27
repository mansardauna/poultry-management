'use strict';

import { cookies } from 'next/headers';
import { getAuthUser } from './auth';
import { supabase as serviceRoleClient } from './supabase';

/**
 * Fast, cookie-first workspace ID resolution per organization / user.
 */
export async function getWorkspaceId(): Promise<string> {
  const cookieStore = await cookies();
  const workspaceCookie = cookieStore.get('pfms_workspace')?.value?.trim();
  const cookieOrgId = cookieStore.get('pfms_org_id')?.value?.trim();

  // If a valid tenant workspace cookie is present (and not stale generic 'main'), return it
  if (workspaceCookie && workspaceCookie !== 'main') {
    return workspaceCookie;
  }

  // If generic 'main' was stored in cookie but we have the tenant orgId, scope to this tenant
  if (cookieOrgId) {
    return `main-${cookieOrgId}`;
  }

  const user = await getAuthUser();
  if (user?.email === 'owner@poultry.com') {
    return 'main-org_owner_main';
  }

  if (user?.email) {
    const userClean = user.email.split('@')[0].toLowerCase();
    try {
      const { data: staffRec } = await serviceRoleClient
        .from('staff')
        .select('workspaceId, assignedBranches')
        .or(`name.eq.${user.email},contact.eq.${user.email},name.eq.${userClean}`)
        .limit(1)
        .maybeSingle();

      if (staffRec?.assignedBranches && Array.isArray(staffRec.assignedBranches) && staffRec.assignedBranches.length > 0) {
        return staffRec.assignedBranches[0];
      }
      if (staffRec?.workspaceId && staffRec.workspaceId !== 'main') {
        return staffRec.workspaceId;
      }
    } catch {}

    try {
      const { data: userRec } = await serviceRoleClient
        .from('users')
        .select('workspaceId, orgId')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle();

      if (userRec?.workspaceId && userRec.workspaceId !== 'main') {
        return userRec.workspaceId;
      }
      if (userRec?.orgId) {
        return `main-${userRec.orgId}`;
      }
    } catch {}
  }

  if (user?.id && user.id !== 'local_user') {
    return `main-org_${user.id.replace(/-/g, '').slice(0, 10)}`;
  }

  return workspaceCookie || 'main-default';
}

/**
 * Strict tenant isolation helper for query builders (Supabase / DataAdapter).
 * Ensures that every tenant only ever retrieves their own workspace's data.
 */
export function applyWorkspaceFilter(query: any, workspaceId: string) {
  const cleanId = (workspaceId || '').replace(/"/g, '').trim();
  if (!cleanId) {
    return query.eq('workspaceId', '__none__');
  }
  return query.eq('workspaceId', cleanId);
}

/**
 * Reusable tenant isolation helper for fetching ONLY the workspaces belonging to the authenticated user/organization.
 */
export async function getTenantWorkspaces(user?: any, cookieOrgId?: string) {
  const cookieStore = await cookies();
  const cookieWs = cookieStore.get('pfms_workspace')?.value?.trim();
  const orgIdVal = cookieOrgId || cookieStore.get('pfms_org_id')?.value?.trim() || '';

  const authUser = user || (await getAuthUser());
  const userClean = (authUser?.email || 'admin').split('@')[0].toLowerCase();
  const orgId = orgIdVal || (authUser?.id && authUser.id !== 'local_user' ? `org_${authUser.id.replace(/-/g, '').slice(0, 10)}` : '');

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
  } catch {}

  const primaryWsId = (cookieWs && cookieWs !== 'main')
    ? cookieWs
    : (orgId ? `main-${orgId}` : `main-org_${userClean}`);

  return [{
    id: primaryWsId,
    name: 'Main Branch',
    type: 'Layer Farm',
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
  } catch {}

  const authUser = user || (await getAuthUser());
  if (authUser?.email === 'owner@poultry.com') {
    return 'pro';
  }

  return 'free';
}
