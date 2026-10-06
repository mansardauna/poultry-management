'use strict';
import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createDataChain, runSql, makeAuthStub, QueryOp } from './dataAdapter';

export function isValidSupabaseUrl(url?: string): boolean {
  if (!url) return false;
  if (url.includes('placeholder')) return false;
  if (url.includes('dwjddjndeaqxlaqynjsy')) return false; // Dead/deleted demo Supabase host
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
      if (cfg?.engine === 'supabase') {
        return 'supabase';
      }
      if (cfg?.engine === 'mysql') {
        return 'mysql';
      }
      if (cfg?.engine === 'postgres') {
        return 'postgres';
      }
    }
  } catch (_e) {}
  if (process.env.DATABASE_URL?.startsWith('mysql')) {
    return 'mysql';
  }
  return 'postgres';
}

// Configurable timeout fetch for Supabase (default 15s) to avoid flaky aborts under network load
function fastFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeoutMs = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS) || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const anySignalHelper = AbortSignal as unknown as { any?: (signals: (AbortSignal | null | undefined)[]) => AbortSignal };
  const signal = init?.signal
    ? (anySignalHelper.any ? anySignalHelper.any([init.signal, controller.signal]) : controller.signal)
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

async function localExecutor(ops: QueryOp[], table: string) {
  try {
    return await runSql(ops, table);
  } catch (err) {
    return { data: null, error: err || new Error('Database operation failed') };
  }
}

export const supabase: SupabaseClient = {
  from: (table: string) => {
    const engine = getLocalEngine();
    if (engine === 'supabase' && realSupabase) {
      return realSupabase.from(table);
    }
    return createDataChain(table, localExecutor);
  },
  auth: (getLocalEngine() === 'supabase' && realSupabase) ? realSupabase.auth : makeAuthStub(),
  rpc: (...args: unknown[]) => {
    const engine = getLocalEngine();
    if (engine === 'supabase' && realSupabase) {
      return (realSupabase.rpc as unknown as (...a: unknown[]) => Promise<{ data: unknown; error: unknown }>)(...args);
    }
    return Promise.resolve({ data: null, error: null });
  },
} as unknown as SupabaseClient;
