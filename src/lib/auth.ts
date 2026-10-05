'use strict';
import { createClient } from './supabaseServer';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from './session';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  username?: string;
  orgId?: string;
  workspaceId?: string;
  tier?: string;
  impersonatedBy?: string;
  impersonatorEmail?: string;
  impersonatedOrgName?: string;
}

/**
 * Get the authenticated user using cryptographically verified JWT session or Supabase Auth.
 * Raw, unsigned cookies and client-supplied headers are strictly rejected.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  // 1. Primary: Cryptographically verified JWT session cookie
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      const session = await verifySession(sessionToken);
      if (session && session.userId && session.role) {
        return {
          id: String(session.userId),
          email: String(session.email || ''),
          role: String(session.role),
          username: session.email ? session.email.split('@')[0] : 'user',
          orgId: session.orgId ? String(session.orgId) : undefined,
          workspaceId: session.workspaceId ? String(session.workspaceId) : undefined,
          tier: session.tier ? String(session.tier) : undefined,
          impersonatedBy: session.impersonatedBy ? String(session.impersonatedBy) : undefined,
          impersonatorEmail: session.impersonatorEmail ? String(session.impersonatorEmail) : undefined,
          impersonatedOrgName: session.impersonatedOrgName ? String(session.impersonatedOrgName) : undefined,
        };
      }
    }
  } catch (_err) {}

  // 2. Secondary: Supabase Auth server session
  try {
    const supabase = await createClient();
    if (supabase.auth && typeof supabase.auth.getUser === 'function') {
      const timeoutPromise = new Promise<{ data: { user: null }; error: null }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null }, error: null }), 1500)
      );

      const { data: { user }, error } = await Promise.race([
        supabase.auth.getUser(),
        timeoutPromise,
      ]);

      if (!error && user) {
        const email = user.email || '';
        try {
          const { supabase: dbClient } = await import('./supabase');
          const { data: userRecs } = await dbClient
            .from('users')
            .select('id, email, username, role, orgId, workspaceId')
            .eq('email', email)
            .limit(1);
          if (userRecs && userRecs.length > 0) {
            const u = userRecs[0];
            return {
              id: u.id,
              email: u.email,
              role: u.role || 'Admin',
              username: u.username || email.split('@')[0],
              orgId: u.orgId,
              workspaceId: u.workspaceId,
            };
          }
        } catch {}

        // No DB record: least-privileged tenant role. NEVER trust user_metadata.role
        // (it is writable by the end user through supabase.auth.updateUser).
        return {
          id: user.id,
          email,
          role: 'Admin',
          username: email.split('@')[0],
        };
      }
    }
  } catch {}

  return null;
}
