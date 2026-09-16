'use strict';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isValidSupabaseUrl } from './supabase';
import { makeAuthStub } from './dataAdapter';

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  if (!isValidSupabaseUrl(url) || !key || key === 'placeholder-key') {
    return {
      auth: makeAuthStub(),
      from: () => {
        throw new Error('Supabase server client not configured');
      },
    } as any;
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from Server Components
          }
        },
      },
    }
  );
}
