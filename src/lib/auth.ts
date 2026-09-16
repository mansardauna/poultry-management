'use strict';
import { createClient } from './supabaseServer';
import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Get the authenticated user using Supabase Auth or local session cookie.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    if (supabase.auth && typeof supabase.auth.getUser === 'function') {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!error && user) {
        return {
          id: user.id,
          email: user.email || '',
          role: user.user_metadata?.role || 'Admin',
        };
      }
    }
  } catch (_err) {
    // Fall back to local session cookies below
  }

  try {
    const cookieStore = await cookies();
    const role = cookieStore.get('pfms_role')?.value;
    const email = cookieStore.get('pfms_email')?.value || 'admin@poultry.local';
    if (role) {
      return {
        id: 'local_user',
        email,
        role,
      };
    }
  } catch (_err) {}

  return null;
}
