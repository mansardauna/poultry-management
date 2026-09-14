'use strict';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  postgresHost?: string;
  postgresPort?: number;
  postgresDb?: string;
  postgresUser?: string;
  mysqlHost?: string;
  mysqlPort?: number;
  mysqlDatabase?: string;
  mysqlUser?: string;
}

function rejectAfter(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Connection attempt timed out')), ms);
  });
}

function dynamicRequire(moduleName: string) {
  try {
    return eval('require')(moduleName);
  } catch (_e) {
    return null;
  }
}

export async function POST(request: Request) {
  let body: TestBody;
  try {
    body = await request.json();
  } catch (_e) {
    return NextResponse.json({ connected: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const type = body.databaseType || 'supabase';

  if (type === 'postgres') {
    const pgModule = dynamicRequire('pg');
    if (!pgModule) {
      return NextResponse.json({
        connected: false,
        databaseType: 'postgres',
        error: 'PostgreSQL driver (pg) is not installed in runtime environment. Install pg package to test Postgres connection.'
      });
    }

    const cfg = body.postgres || {};
    const host = body.postgresHost || cfg.host || 'localhost';
    const port = body.postgresPort || cfg.port || 5432;
    const database = body.postgresDb || cfg.database || 'postgres';
    const user = body.postgresUser || cfg.user || 'postgres';
    const password = cfg.password || '';

    const { Client } = pgModule;
    const client = new Client({
      host,
      port: Number(port),
      database,
      user,
      password,
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
    const mysqlModule = dynamicRequire('mysql2/promise');
    if (!mysqlModule) {
      return NextResponse.json({
        connected: false,
        databaseType: 'mysql',
        error: 'MySQL driver (mysql2) is not installed in runtime environment. Install mysql2 package to test MySQL connection.'
      });
    }

    const cfg = body.mysql || {};
    const host = body.mysqlHost || cfg.host || 'localhost';
    const port = body.mysqlPort || cfg.port || 3306;
    const database = body.mysqlDatabase || cfg.database || 'poultry_db';
    const user = body.mysqlUser || cfg.user || 'root';
    const password = cfg.password || '';

    let conn: any = null;
    try {
      conn = await Promise.race([
        mysqlModule.createConnection({
          host,
          port: Number(port),
          database,
          user,
          password,
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

  // Supabase (Default / Fallback)
  const cfg = body.supabase || {};
  const url = cfg.url || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = cfg.serviceRoleKey || cfg.anonKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    return NextResponse.json({
      connected: false,
      databaseType: 'supabase',
      error: 'Supabase URL or Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.',
    });
  }

  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await Promise.race([
      client.from('systemSettings').select('id').limit(1),
      rejectAfter(TEST_TIMEOUT_MS),
    ]);

    if (error) {
      return NextResponse.json({
        connected: false,
        databaseType: 'supabase',
        error: error.message || 'Supabase connectivity check failed.',
      });
    }

    return NextResponse.json({
      connected: true,
      databaseType: 'supabase',
      message: 'Supabase database connection verified — connection is live.',
    });
  } catch (err: unknown) {
    return NextResponse.json({
      connected: false,
      databaseType: 'supabase',
      error: err instanceof Error ? err.message : 'Supabase connection failed.',
    });
  }
}