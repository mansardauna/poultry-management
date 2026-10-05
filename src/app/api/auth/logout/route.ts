'use strict';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isSupabaseMode, loadDatabaseConfig, deleteSession } from '@/lib/authdb';
import { clearSession } from '@/lib/sessionCookies';

/** Exported function POST */
export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('pms_session')?.value;

  if (token && !(await isSupabaseMode())) {
    const cfg = await loadDatabaseConfig();
    if (cfg) {
      await deleteSession(cfg, token).catch(() => {});
    }
  }

  if (await isSupabaseMode()) {
    try {
      const { createClient } = await import('@/lib/supabaseServer');
      const supabase = await createClient();
      await supabase.auth.signOut().catch(() => {});
    } catch (_e) {}
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('pms_session', '', { maxAge: 0, path: '/' });
  response.cookies.set('pms_db_mode', '', { maxAge: 0, path: '/' });
  response.cookies.set('pms_session_user', '', { maxAge: 0, path: '/' });
  clearSession(response);

  return response;
}