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

const realSupabase = isConfigured
  ? createClient(rawUrl!, rawKey!, { auth: { persistSession: false } })
  : null;

async function smartExecutor(ops: any[], table: string) {
  if (realSupabase) {
    try {
      let chain: any = realSupabase.from(table);
      for (const op of ops) {
        if (op.t === 'select') chain = chain.select(op.cols || '*');
        else if (op.t === 'eq') chain = chain.eq(op.col, op.val);
        else if (op.t === 'neq') chain = chain.neq(op.col, op.val);
        else if (op.t === 'gt') chain = chain.gt(op.col, op.val);
        else if (op.t === 'gte') chain = chain.gte(op.col, op.val);
        else if (op.t === 'lt') chain = chain.lt(op.col, op.val);
        else if (op.t === 'lte') chain = chain.lte(op.col, op.val);
        else if (op.t === 'in') chain = chain.in(op.col, op.vals);
        else if (op.t === 'or') chain = chain.or(op.filters);
        else if (op.t === 'order') chain = chain.order(op.col, { ascending: op.asc });
        else if (op.t === 'limit') chain = chain.limit(op.n);
        else if (op.t === 'range') chain = chain.range(op.from, op.to);
        else if (op.t === 'maybeSingle') chain = chain.maybeSingle();
        else if (op.t === 'single') chain = chain.single();
        else if (op.t === 'insert') chain = chain.insert(op.rows);
        else if (op.t === 'upsert') chain = chain.upsert(op.rows);
        else if (op.t === 'update') chain = chain.update(op.obj);
        else if (op.t === 'delete') chain = chain.delete();
      }
      const res = await chain;
      if (!res.error) return res;
    } catch (_e) {
      // Fall through if Supabase network call fails
    }
  }

  // Local database execution (MySQL/PostgreSQL) or fallback to empty dataset
  try {
    const res = await runSql(ops, table);
    if (res.data !== null || res.error === null) return res;
  } catch (_e) {}

  const isSingle = ops.some((o) => o.t === 'single' || o.t === 'maybeSingle');
  return { data: isSingle ? null : [], error: null };
}

export const supabase: any = {
  from: (table: string) => createDataChain(table, smartExecutor),
  auth: realSupabase ? realSupabase.auth : makeAuthStub(),
  rpc: async (...args: any[]) => {
    if (realSupabase) {
      try {
        return await realSupabase.rpc(args[0], args[1]);
      } catch (_e) {}
    }
    return { data: null, error: null };
  },
};
