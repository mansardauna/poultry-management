'use strict';
import fs from 'fs';
import path from 'path';
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

function getLocalEngine(): 'mysql' | 'postgres' | 'supabase' {
  try {
    const configPath = path.join(process.cwd(), 'data', 'database.config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const cfg = JSON.parse(raw);
      if (cfg?.engine === 'mysql' || cfg?.engine === 'postgres') {
        return cfg.engine;
      }
    }
  } catch (_e) {}
  return 'supabase';
}

// 1.0s Strict Timeout Fetch for Supabase to prevent network hangs & retries
function fastFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000);
  const signal = init?.signal
    ? (AbortSignal as any).any([init.signal, controller.signal])
    : controller.signal;

  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timeoutId));
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = isValidSupabaseUrl(rawUrl) && Boolean(rawKey && rawKey !== 'placeholder-key');

export const realSupabase = isSupabaseConfigured
  ? createClient(rawUrl!, rawKey!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: fastFetch },
    })
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
    const engine = getLocalEngine();
    if (engine === 'supabase' && realSupabase) {
      return realSupabase.from(table);
    }
    return createDataChain(table, localExecutor);
  },
  auth: (getLocalEngine() === 'supabase' && realSupabase) ? realSupabase.auth : makeAuthStub(),
  rpc: (...args: any[]) => {
    const engine = getLocalEngine();
    if (engine === 'supabase' && realSupabase) {
      return (realSupabase.rpc as any)(...args);
    }
    return Promise.resolve({ data: null, error: null });
  },
};
