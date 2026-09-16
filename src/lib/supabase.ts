'use strict';
import { createClient } from '@supabase/supabase-js';
import { createDataChain, runSql, makeAuthStub } from './dataAdapter';

export function isValidSupabaseUrl(url?: string): boolean {
  if (!url) return false;
  if (url.includes('placeholder')) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const isConfigured = isValidSupabaseUrl(rawUrl) && Boolean(rawKey && rawKey !== 'placeholder-key');

export const realSupabase = isConfigured
  ? createClient(rawUrl!, rawKey!, { auth: { persistSession: false } })
  : null;

async function localExecutor(ops: any[], table: string) {
  try {
    const res = await runSql(ops, table);
    if (res.data !== null || res.error === null) return res;
  } catch (_e) {}

  const isSingle = ops.some((o) => o.t === 'single' || o.t === 'maybeSingle');
  return { data: isSingle ? null : [], error: null };
}

export const supabase: any = {
  from: (table: string) => {
    if (realSupabase) {
      return realSupabase.from(table);
    }
    return createDataChain(table, localExecutor);
  },
  auth: realSupabase ? realSupabase.auth : makeAuthStub(),
  rpc: (...args: any[]) => {
    if (realSupabase) {
      return (realSupabase.rpc as any)(...args);
    }
    return Promise.resolve({ data: null, error: null });
  },
};
