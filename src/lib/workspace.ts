'use strict';

import { cookies } from 'next/headers';
import { getAuthUser } from './auth';
import { supabase as serviceRoleClient } from './supabase';

/**
 * Fast, cookie-first workspace ID resolution per organization / user.
 */
function parseBranches(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    if (raw.trim() && raw !== '[]') return [raw.trim().replace(/[\[\]"']/g, '')];
  }
  return [];
}

/**
 * Fast, cookie-first workspace ID resolution per organization / user.
 */
export async function getWorkspaceId(): Promise<string> {
  const cookieStore = await cookies();
  const workspaceCookie = cookieStore.get('pfms_workspace')?.value?.trim();
  const cookieOrgId = cookieStore.get('pfms_org_id')?.value?.trim();

  const user = await getAuthUser();
  if (user?.email === 'owner@poultry.com') {
    return 'main-org_owner_main';
  }

  // If user is Staff, strictly lock them to their assigned branches
  if (user && user.role === 'Staff') {
    const rawUsername = (user.username || user.email || '').replace(/@poultry\.local$/, '').toLowerCase();
    const staffIdFromUser = user.id?.startsWith('usr_') ? user.id.replace('usr_', '') : '';
    try {
      let query = serviceRoleClient.from('staff').select('workspaceId, assignedBranches');
      if (staffIdFromUser) {
        query = query.eq('id', staffIdFromUser);
      } else {
        query = query.or(`username.eq.${rawUsername},contact.eq.${rawUsername}`);
      }
      const { data: staffRec } = await query.limit(1).maybeSingle();

      const assigned = parseBranches(staffRec?.assignedBranches);
      if (assigned.length > 0) {
        if (workspaceCookie && assigned.includes(workspaceCookie)) {
          return workspaceCookie;
        }
        return assigned[0];
      }
      if (staffRec?.workspaceId && staffRec.workspaceId !== 'main') {
        return staffRec.workspaceId;
      }
    } catch {}
  }

  // If a valid tenant workspace cookie is present (and not stale generic 'main'), return it
  if (workspaceCookie && workspaceCookie !== 'main') {
    return workspaceCookie;
  }

  // If generic 'main' was stored in cookie but we have the tenant orgId, scope to this tenant
  if (cookieOrgId) {
    return `main-${cookieOrgId}`;
  }

  if (user?.email) {
    const userClean = user.email.split('@')[0].toLowerCase();

    // Check staff record for workspace or assigned branches
    try {
      const { data: staffRec } = await serviceRoleClient
        .from('staff')
        .select('workspaceId, assignedBranches')
        .or(`name.eq.${user.email},contact.eq.${user.email},name.eq.${userClean},username.eq.${user.email},username.eq.${userClean}`)
        .limit(1)
        .maybeSingle();

      const assigned = parseBranches(staffRec?.assignedBranches);
      if (assigned.length > 0) {
        return assigned[0];
      }
      if (staffRec?.workspaceId && staffRec.workspaceId !== 'main') {
        return staffRec.workspaceId;
      }
    } catch {}

    // Check user record for workspace or orgId
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
 * Staff-aware workspace filter helper.
 * Matches records where workspaceId equals cleanId OR where assignedBranches includes cleanId.
 */
export function applyStaffWorkspaceFilter(query: any, workspaceId: string) {
  const cleanId = (workspaceId || '').replace(/"/g, '').trim();
  if (!cleanId) {
    return query.eq('workspaceId', '__none__');
  }
  return query.or(`workspaceId.eq.${cleanId},assignedBranches.like.%${cleanId}%`);
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

  // If Staff role: return ONLY assigned branches
  if (authUser?.role === 'Staff') {
    const rawUsername = (authUser.username || authUser.email || '').replace(/@poultry\.local$/, '').toLowerCase();
    const staffIdFromUser = authUser.id?.startsWith('usr_') ? authUser.id.replace('usr_', '') : '';
    try {
      let query = serviceRoleClient.from('staff').select('workspaceId, assignedBranches');
      if (staffIdFromUser) {
        query = query.eq('id', staffIdFromUser);
      } else {
        query = query.or(`username.eq.${rawUsername},contact.eq.${rawUsername}`);
      }
      const { data: staffRec } = await query.limit(1).maybeSingle();

      const assigned = parseBranches(staffRec?.assignedBranches);
      if (assigned.length > 0) {
        const { data: assignedWs } = await serviceRoleClient
          .from('workspaces')
          .select('*')
          .in('id', assigned);

        if (assignedWs && assignedWs.length > 0) {
          return assignedWs;
        }
      } else if (staffRec?.workspaceId) {
        const { data: directWs } = await serviceRoleClient
          .from('workspaces')
          .select('*')
          .eq('id', staffRec.workspaceId);

        if (directWs && directWs.length > 0) {
          return directWs;
        }
      }
    } catch {}
  }

  // Resolve authoritative organization ID
  let resolvedOrgId = orgIdVal;

  if (!resolvedOrgId && authUser?.email) {
    try {
      const { data: userRec } = await serviceRoleClient
        .from('users')
        .select('orgId, workspaceId')
        .eq('email', authUser.email)
        .limit(1)
        .maybeSingle();

      if (userRec?.orgId) {
        resolvedOrgId = userRec.orgId;
      } else if (userRec?.workspaceId && userRec.workspaceId.includes('org_')) {
        const match = userRec.workspaceId.match(/org_[a-zA-Z0-9]+/);
        if (match) resolvedOrgId = match[0];
      }
    } catch {}
  }

  // Also check staff record for manager's organization
  if (!resolvedOrgId && authUser?.email) {
    try {
      const { data: staffRec } = await serviceRoleClient
        .from('staff')
        .select('workspaceId, assignedBranches')
        .or(`name.eq.${authUser.email},contact.eq.${authUser.email},name.eq.${userClean},username.eq.${authUser.email},username.eq.${userClean}`)
        .limit(1)
        .maybeSingle();

      const wsTarget = staffRec?.workspaceId || (parseBranches(staffRec?.assignedBranches)[0]);
      if (wsTarget && wsTarget.includes('org_')) {
        const match = wsTarget.match(/org_[a-zA-Z0-9]+/);
        if (match) resolvedOrgId = match[0];
      }
    } catch {}
  }

  const finalOrgId = resolvedOrgId || (authUser?.id && authUser.id !== 'local_user' ? `org_${authUser.id.replace(/-/g, '').slice(0, 10)}` : '');

  try {
    let query = serviceRoleClient.from('workspaces').select('*');
    if (finalOrgId) {
      query = query.or(`id.like.%${finalOrgId}%,ownerUsername.eq.${userClean}`);
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
    : (finalOrgId ? `main-${finalOrgId}` : `main-org_${userClean}`);

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
