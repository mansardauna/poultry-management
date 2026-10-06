'use strict';

import { cookies } from 'next/headers';
import { getAuthUser, AuthUser } from './auth';
import { supabase as serviceRoleClient } from './supabase';

/**
 * Fast, cookie-first workspace ID resolution per organization / user.
 */
function parseBranches(raw: unknown): string[] {
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
  const user = await getAuthUser();
  if (!user) {
    return '__unauthenticated__';
  }

  const cookieStore = await cookies();
  const workspaceCookie = cookieStore.get('pfms_workspace')?.value?.trim();

  // SuperAdmin can access requested workspace or default
  if (user.role === 'SuperAdmin') {
    if (workspaceCookie && workspaceCookie !== 'main') {
      return workspaceCookie;
    }
    return user.workspaceId || 'main-org_owner_main';
  }

  // Staff: strictly lock to assigned branches
  if (user.role === 'Staff') {
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
    return user.workspaceId || '__unauthorized_staff__';
  }

  // Admin & Manager: strictly validate that workspace belongs to user's organization
  let orgId = user.orgId || '';
  if (!orgId && user.workspaceId) {
    const match = user.workspaceId.match(/org_[a-zA-Z0-9]+/);
    if (match) orgId = match[0];
  }

  if (workspaceCookie && workspaceCookie !== 'main') {
    // 1. Direct org match in workspace ID string
    if (orgId && workspaceCookie.includes(orgId)) {
      return workspaceCookie;
    }
    // 2. Database validation against tenant's workspaces
    try {
      const { data: ws } = await serviceRoleClient
        .from('workspaces')
        .select('id, orgId')
        .eq('id', workspaceCookie)
        .limit(1)
        .maybeSingle();

      if (ws && orgId && (ws.orgId === orgId || ws.id.includes(orgId))) {
        return workspaceCookie;
      }
    } catch {}
    // Reject foreign tenant workspace cookie and fall back to user's verified workspace
  }

  if (user.workspaceId && user.workspaceId !== 'main') {
    return user.workspaceId;
  }
  if (orgId) {
    return `main-${orgId}`;
  }

  return user.id ? `main-org_${user.id.replace(/-/g, '').slice(0, 10)}` : '__unauthorized__';
}

/**
 * Strict tenant isolation helper for query builders (Supabase / DataAdapter).
 * Ensures that every tenant only ever retrieves their own workspace's data.
 */
export function applyWorkspaceFilter<T>(query: T, workspaceId: string): T {
  const cleanId = (workspaceId || '').replace(/"/g, '').trim();
  const q = query as unknown as { eq: (field: string, val: string) => T };
  if (!cleanId) {
    return q.eq('workspaceId', '__none__');
  }
  return q.eq('workspaceId', cleanId);
}

/**
 * Staff-aware workspace filter helper.
 * Matches records where workspaceId equals cleanId OR where assignedBranches includes cleanId.
 */
export function applyStaffWorkspaceFilter<T>(query: T, workspaceId: string): T {
  const cleanId = (workspaceId || '').replace(/"/g, '').trim();
  const q = query as unknown as { eq: (field: string, val: string) => T; or: (filter: string) => T };
  if (!cleanId) {
    return q.eq('workspaceId', '__none__');
  }
  return q.or(`workspaceId.eq.${cleanId},assignedBranches.like.%${cleanId}%`);
}

/**
 * Reusable tenant isolation helper for fetching ONLY the workspaces belonging to the authenticated user/organization.
 */
export async function getTenantWorkspaces(user?: AuthUser | null) {
  const authUser = user || (await getAuthUser());
  if (!authUser) {
    return [];
  }
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

  // Resolve authoritative organization ID strictly from verified auth session or database lookup (rejecting raw/unsigned cookies)
  let resolvedOrgId = authUser.orgId || '';

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

  const primaryWsId = finalOrgId ? `main-${finalOrgId}` : `main-org_${userClean}`;

  return [{
    id: primaryWsId,
    name: 'Main Branch',
    type: 'Layer Farm',
    createdAt: new Date().toISOString(),
    ownerUsername: userClean
  }];
}

export async function getTenantTier(user?: AuthUser | null) {
  const authUser = user || (await getAuthUser());
  if (!authUser) {
    return 'free';
  }
  const isSuperAdmin = authUser?.role === 'SuperAdmin';
  if (isSuperAdmin) {
    return 'enterprise';
  }

  // 1. Check verified session token tier
  if (authUser?.tier) {
    const tier = (authUser.tier || '').toLowerCase();
    if (tier === 'enterprise' || tier === 'entrepreneur' || tier === 'enterprise_plus') return 'enterprise';
    if (tier === 'pro') return 'pro';
  }

  // 2. Query authoritative organization subscription from database
  if (authUser?.id) {
    try {
      const { data: memberData } = await serviceRoleClient
        .from('organization_members')
        .select('orgId')
        .eq('userId', authUser.id)
        .limit(1)
        .maybeSingle();

      const targetOrgId = memberData?.orgId || authUser.orgId;
      if (targetOrgId) {
        const { data: org } = await serviceRoleClient
          .from('organizations')
          .select('subscriptionTier, subscriptionStatus, subscriptionEndsAt')
          .eq('id', targetOrgId)
          .limit(1)
          .maybeSingle();

        if (org?.subscriptionTier) {
          if (org.subscriptionEndsAt && new Date(org.subscriptionEndsAt).getTime() < Date.now()) {
            return 'free';
          }
          const tier = (org.subscriptionTier || '').toLowerCase();
          if (tier === 'enterprise' || tier === 'entrepreneur' || tier === 'enterprise_plus') return 'enterprise';
          if (tier === 'pro') return 'pro';
        }
      }
    } catch {}
  }

  return 'free';
}
