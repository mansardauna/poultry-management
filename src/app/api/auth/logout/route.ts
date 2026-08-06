'use strict';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

/** Exported function POST */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  const response = NextResponse.json({ ok: true });
  response.cookies.set('pfms_workspace', '', { maxAge: 0, path: '/' });
  response.cookies.set('pfms_org_id', '', { maxAge: 0, path: '/' });
  response.cookies.set('pfms_tier', '', { maxAge: 0, path: '/' });
  
  return response;
}
