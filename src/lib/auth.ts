'use strict';
import { createClient } from './supabaseServer';
import { cookies, headers } from 'next/headers';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  username?: string;
}

/**
 * Get the authenticated user using Supabase Auth or local session cookie.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
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
        const isSuper = email === 'owner@poultry.com' || email === 'superadmin@pfms.com' || user.user_metadata?.role === 'SuperAdmin';
        return {
          id: user.id,
          email,
          role: isSuper ? 'SuperAdmin' : (user.user_metadata?.role || 'Admin'),
        };
      }
    }
  } catch {
    // Fall back to local session cookies below
  }

  try {
    const cookieStore = await cookies();
    const headersList = await headers().catch(() => null);
    const headerRole = headersList?.get('x-user-role');
    const headerEmail = headersList?.get('x-user-email');
    const role = headerRole || cookieStore.get('pfms_role')?.value;
    const email = headerEmail || cookieStore.get('pfms_email')?.value || '';

    if (email === 'owner@poultry.com' || email === 'superadmin@pfms.com' || role === 'SuperAdmin') {
      return {
        id: 'superadmin',
        email: email || 'owner@poultry.com',
        role: 'SuperAdmin',
        username: 'superadmin',
      };
    }

    if (role) {
      try {
        const { supabase } = await import('./supabase');
        const { data: userRecs } = await supabase
          .from('users')
          .select('id, email, username, role')
          .eq('email', email)
          .limit(1);
        if (userRecs && userRecs.length > 0) {
          const u = userRecs[0];
          return {
            id: u.id,
            email: u.email,
            role: u.role || role,
            username: u.username,
          };
        }
      } catch {}

      return {
        id: 'local_user',
        email: email || 'admin@poultry.local',
        role,
      };
    }
  } catch {}

  return null;
}
