'use strict';
import { cookies } from 'next/headers';
import type { AuthUser } from './authdb';
import { isSupabaseMode, loadDatabaseConfig, getUserBySessionToken } from './authdb';

/**
 * Get the authenticated user.
 *
 * - Supabase mode (default): reads the Supabase session cookie.
 * - Local mode (MySQL/Postgres chosen in the wizard): reads the `pms_session`
 *   cookie and validates it against the `sessions` table of the configured DB.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();

  if (await isSupabaseMode()) {
    try {
      const { createClient } = await import('./supabaseServer');
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return {
        id: user.id,
        email: user.email || '',
        username: user.email || '',
        role: user.user_metadata?.role || 'Admin',
      };
    } catch (_err) {
      return null;
    }
  }

  const token = cookieStore.get('pms_session')?.value;
  if (!token) return null;

  const cfg = await loadDatabaseConfig();
  if (!cfg) return null;
  return getUserBySessionToken(cfg, token);
}