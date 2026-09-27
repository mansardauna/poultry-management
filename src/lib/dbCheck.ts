'use strict';

import mysql from 'mysql2/promise';
import { Pool } from 'pg';
import { loadDatabaseConfig } from './authdb';
import { supabase } from './supabase';

/**
 * Checks whether an active and reachable database connection is currently configured and live.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const config = await loadDatabaseConfig();
    if (!config) return false;

    if (config.engine === 'mysql' && config.mysql) {
      const conn = await mysql.createConnection({
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
        connectTimeout: 2500,
      });
      await conn.ping();
      await conn.end();
      return true;
    }

    if (config.engine === 'postgres' && config.postgres) {
      const pool = new Pool({
        host: config.postgres.host,
        port: config.postgres.port,
        user: config.postgres.user,
        password: config.postgres.password,
        database: config.postgres.database,
        connectionTimeoutMillis: 2500,
      });
      const res = await pool.query('SELECT 1');
      await pool.end();
      return Boolean(res);
    }

    if (config.engine === 'supabase') {
      const { data, error } = await supabase.from('systemSettings').select('id').limit(1);
      return !error || Boolean(data);
    }

    return false;
  } catch (_err) {
    return false;
  }
}

/**
 * First time install wizard should run if database connection not provided.
 * If active connection is detected, do not allow running installer again.
 */
export async function isSystemInstalled(): Promise<boolean> {
  return await checkDatabaseConnection();
}
