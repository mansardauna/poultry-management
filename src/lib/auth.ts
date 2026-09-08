'use strict';
import { createClient } from './supabaseServer';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Get the authenticated user using Supabase Auth.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'Admin', // Default to Admin for now
    };
  } catch (_err) {
    return null;
  }
}

