'use strict';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import mysql from 'mysql2/promise';

/**
 * POST /api/setup/test — Validates the database credentials entered in the
 * setup wizard (NOT the values in .env). Attempts a real connection to the
 * selected engine so the wizard can block "Next" until the DB step passes.
 */

const TEST_TIMEOUT_MS = 8000;

interface PostgresConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}

interface MysqlConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}

interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  serviceRoleKey?: string;
}

interface TestBody {
  databaseType?: 'supabase' | 'postgres' | 'mysql';
  postgres?: PostgresConfig;
  mysql?: MysqlConfig;
  supabase?: SupabaseConfig;
}

function rejectAfter(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Connection attempt timed out')), ms);
  });
}

export async function POST(request: Request) {
  let body: TestBody;
  try {
    body = await request.json();
  } catch (_e) {
    return NextResponse.json({ connected: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const type = body.databaseType || 'postgres';

  if (type === 'postgres') {
    const cfg = body.postgres || {};
    const client = new Client({
      host: cfg.host || 'localhost',
      port: Number(cfg.port || 5432),
      database: cfg.database || 'postgres',
      user: cfg.user || 'postgres',
      password: cfg.password || '',
      connectionTimeoutMillis: TEST_TIMEOUT_MS,
    });

    try {
      await Promise.race([client.connect(), rejectAfter(TEST_TIMEOUT_MS)]);
      await Promise.race([client.query('SELECT 1'), rejectAfter(TEST_TIMEOUT_MS)]);
      return NextResponse.json({
        connected: true,
        databaseType: 'postgres',
        message: 'PostgreSQL connection verified — connection is live.',
      });
    } catch (err: unknown) {
      return NextResponse.json({
        connected: false,
        databaseType: 'postgres',
        error: err instanceof Error ? err.message : 'PostgreSQL connection failed.',
      });
    } finally {
      await client.end().catch(() => {});
    }
  }

  if (type === 'mysql') {
    const cfg = body.mysql || {};
    let conn: mysql.Connection | null = null;
    try {
      conn = await Promise.race([
        mysql.createConnection({
          host: cfg.host || 'localhost',
          port: Number(cfg.port || 3306),
          database: cfg.database || 'poultry_db',
          user: cfg.user || 'root',
          password: cfg.password || '',
          connectTimeout: TEST_TIMEOUT_MS,
        }),
        rejectAfter(TEST_TIMEOUT_MS),
      ]);
      await Promise.race([conn.query('SELECT 1'), rejectAfter(TEST_TIMEOUT_MS)]);
      return NextResponse.json({
        connected: true,
        databaseType: 'mysql',
        message: 'MySQL connection verified — connection is live.',
      });
    } catch (err: unknown) {
      return NextResponse.json({
        connected: false,
        databaseType: 'mysql',
        error: err instanceof Error ? err.message : 'MySQL connection failed.',
      });
    } finally {
      await conn?.end().catch(() => {});
    }
  }

  // Supabase: validates the project URL + keys entered in the wizard.
  // Anon key (or service role key) is used to read the settings table.
  const s = body.supabase || {};
  const url = s.url?.trim();
  const anonKey = s.anonKey?.trim();
  const serviceRoleKey = s.serviceRoleKey?.trim();

  if (!url) {
    return NextResponse.json({ connected: false, databaseType: 'supabase', error: 'Supabase project URL is required.' });
  }
  if (!anonKey && !serviceRoleKey) {
    return NextResponse.json({
      connected: false,
      databaseType: 'supabase',
      error: 'Anon (publishable) key or service role key is required.',
    });
  }

  const client = createClient(url, serviceRoleKey || anonKey || '');
  try {
    const { data, error } = await Promise.race([
      client.from('systemSettings').select('id').limit(1),
      rejectAfter(TEST_TIMEOUT_MS).then(() => ({ data: null, error: { message: 'Supabase request timed out' } })),
    ]);
    if (error) {
      return NextResponse.json({ connected: false, databaseType: 'supabase', error: error.message });
    }
    return NextResponse.json({
      connected: true,
      databaseType: 'supabase',
      message: 'Supabase connection verified — credentials are valid.',
      data: Boolean(data),
    });
  } catch (err: unknown) {
    return NextResponse.json({
      connected: false,
      databaseType: 'supabase',
      error: err instanceof Error ? err.message : 'Supabase connection failed.',
    });
  }
}