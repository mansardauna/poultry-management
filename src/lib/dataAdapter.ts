'use strict';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { Pool } from 'pg';
import { loadDatabaseConfig } from './authdb';

/**
 * Supabase-compatible query builder that runs against the wizard-selected
 * database (MySQL / PostgreSQL) through a chain that is `await`-able.
 *
 * The app writes `await supabase.from('batches').select('*').eq(...).range(...)`
 * everywhere; this adapter reproduces that surface with real SQL so the app can
 * run fully on a self-hosted MySQL/Postgres database.
 */

export type QueryOp =
  | { t: 'select'; cols?: string }
  | { t: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'; col: string; val: unknown }
  | { t: 'in'; col: string; vals: unknown[] }
  | { t: 'or'; filters: string }
  | { t: 'order'; col: string; asc: boolean }
  | { t: 'limit'; n: number }
  | { t: 'range'; from: number; to: number }
  | { t: 'maybeSingle' }
  | { t: 'single' }
  | { t: 'insert'; rows: Record<string, unknown> | Record<string, unknown>[] }
  | { t: 'upsert'; rows: Record<string, unknown> | Record<string, unknown>[] }
  | { t: 'update'; obj: Record<string, unknown> }
  | { t: 'delete' };

export type Executor = (ops: QueryOp[], table: string) => Promise<{ data: any; error: any }>;

type Row = Record<string, unknown>;
type QueryResult = { data: Row[] | Row | null; error: unknown };

const JSON_LIKE = /^[\[{]/;

function encodeValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

function decodeValue(v: unknown): unknown {
  if (typeof v === 'string') {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (JSON_LIKE.test(v)) {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
  }
  return v;
}

const numericCols = new Map<string, Set<string>>();

function recordNumericCols(table: string, row: Row): void {
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      let s = numericCols.get(table);
      if (!s) {
        s = new Set();
        numericCols.set(table, s);
      }
      s.add(k);
    }
  }
}

function decodeRow(row: Row, numSet?: Set<string>): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (numSet?.has(k) && typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v)) {
      out[k] = Number(v);
    } else {
      out[k] = decodeValue(v);
    }
  }
  return out;
}

export function createDataChain(table: string, executor: Executor) {
  const ops: QueryOp[] = [];

  const chain = {
    select(cols?: string) {
      ops.push({ t: 'select', cols });
      return chain;
    },
    eq(col: string, val: unknown) {
      ops.push({ t: 'eq', col, val });
      return chain;
    },
    neq(col: string, val: unknown) {
      ops.push({ t: 'neq', col, val });
      return chain;
    },
    gt(col: string, val: unknown) {
      ops.push({ t: 'gt', col, val });
      return chain;
    },
    gte(col: string, val: unknown) {
      ops.push({ t: 'gte', col, val });
      return chain;
    },
    lt(col: string, val: unknown) {
      ops.push({ t: 'lt', col, val });
      return chain;
    },
    lte(col: string, val: unknown) {
      ops.push({ t: 'lte', col, val });
      return chain;
    },
    in(col: string, vals: unknown[]) {
      ops.push({ t: 'in', col, vals });
      return chain;
    },
    or(filters: string) {
      ops.push({ t: 'or', filters });
      return chain;
    },
    order(col: string, opts?: { ascending?: boolean }) {
      ops.push({ t: 'order', col, asc: opts?.ascending !== false });
      return chain;
    },
    limit(n: number) {
      ops.push({ t: 'limit', n });
      return chain;
    },
    range(from: number, to: number) {
      ops.push({ t: 'range', from, to });
      return chain;
    },
    maybeSingle() {
      ops.push({ t: 'maybeSingle' });
      return chain;
    },
    single() {
      ops.push({ t: 'single' });
      return chain;
    },
    insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
      ops.push({ t: 'insert', rows });
      return chain;
    },
    upsert(rows: Record<string, unknown> | Record<string, unknown>[]) {
      ops.push({ t: 'upsert', rows });
      return chain;
    },
    update(obj: Record<string, unknown>) {
      ops.push({ t: 'update', obj });
      return chain;
    },
    delete() {
      ops.push({ t: 'delete' });
      return chain;
    },
    then(resolve: (v: any) => any, reject: (e?: any) => any) {
      return executor(ops, table).then(resolve, reject);
    },
    catch(reject: (e?: any) => any) {
      return executor(ops, table).then(undefined, reject);
    },
  };

  return chain;
}

// ---- SQL execution (MySQL + PostgreSQL) ----

function quoteId(engine: 'mysql' | 'postgres', id: string): string {
  return engine === 'mysql' ? `\`${id.replace(/`/g, '')}\`` : `"${id.replace(/"/g, '')}"`;
}

function parseOrFilter(filter: string): { col: string; op: string; value: string }[] {
  return filter.split(',').map((part) => {
    const m = /^([^.]+)\.([^.]+)\.(.*)$/.exec(part.trim());
    if (!m) return { col: '1', op: 'eq', value: '1' };
    let val = m[3];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return { col: m[1], op: m[2], value: val };
  });
}

async function runSql(ops: QueryOp[], table: string): Promise<QueryResult> {
  const cfg = await loadDatabaseConfig();
  if (!cfg || cfg.engine === 'supabase') {
    return { data: null, error: { message: 'No local database configured.' } };
  }
  const engine = cfg.engine;

  const pool = engine === 'mysql' ? await getMyPool(cfg.mysql!) : await getPgPool2(cfg.postgres!);
  const params: unknown[] = [];
  let phIndex = 0;
  const ph = () => (engine === 'mysql' ? '?' : `$${++phIndex}`);
  const qi = (c: string) => quoteId(engine, c);

  const writeOp = ops.find((o) => o.t === 'insert' || o.t === 'upsert');
  const updateOp = ops.find((o) => o.t === 'update');
  const deleteOp = ops.find((o) => o.t === 'delete');
  const selectOp = ops.find((o) => o.t === 'select');
  const filters = ops.filter(
    (o) => o.t === 'eq' || o.t === 'neq' || o.t === 'gt' || o.t === 'gte' || o.t === 'lt' || o.t === 'lte' || o.t === 'like' || o.t === 'ilike' || o.t === 'in' || o.t === 'or'
  );
  const orderOp = ops.find((o) => o.t === 'order') as { t: 'order'; col: string; asc: boolean } | undefined;
  const limitOp = ops.find((o) => o.t === 'limit') as { t: 'limit'; n: number } | undefined;
  const rangeOp = ops.find((o) => o.t === 'range') as { t: 'range'; from: number; to: number } | undefined;
  const maybeSingle = ops.some((o) => o.t === 'maybeSingle');
  const single = ops.some((o) => o.t === 'single');
  const likeKw = engine === 'postgres' ? 'ILIKE' : 'LIKE';

  // ---- Writes ----
  if (writeOp) {
    const rawRows = Array.isArray(writeOp.rows) ? writeOp.rows : [writeOp.rows];
    const rows: Row[] = rawRows
      .filter((r) => r && typeof r === 'object')
      .map((r) => ({ ...r, id: typeof r.id === 'string' && r.id !== '' ? r.id : `r_${crypto.randomUUID()}` }));
    if (rows.length === 0) {
      return { data: null, error: null };
    }
    for (const r of rows) recordNumericCols(table, r);
    await ensureShapes(engine, pool, table, rows);
    const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
    const placeholders = rows.map(() => `(${cols.map(ph).join(',')})`).join(',');
    const values = rows.flatMap((r) => cols.map((c) => encodeValue(r[c] ?? null)));
    let sql = `INSERT INTO ${qi(table)} (${cols.map(qi).join(',')}) VALUES ${placeholders}`;
    if (writeOp.t === 'upsert') {
      if (cols.includes('id')) {
        const updates = cols.filter((c) => c !== 'id').map((c) => engine === 'mysql' ? `${qi(c)}=VALUES(${qi(c)})` : `${qi(c)}=EXCLUDED.${qi(c)}`).join(',');
        if (updates) {
          const conflict = engine === 'mysql'
            ? ` ON DUPLICATE KEY UPDATE ${updates}`
            : ` ON CONFLICT (${qi('id')}) DO UPDATE SET ${updates}`;
          sql += conflict;
        }
      }
    }
    await run(engine, pool, sql, values);
    const ids = rows.filter((r) => r.id).map((r) => r.id);
    if (ids.length > 0) {
      return { data: rows, error: null };
    }
    return { data: rows, error: null };
  }

  if (updateOp) {
    const entries = Object.entries(updateOp.obj);
    if (entries.length === 0) {
      return { data: null, error: null };
    }
    await ensureShapes(engine, pool, table, [updateOp.obj]);
    recordNumericCols(table, updateOp.obj);
    const setSql = entries.map(([c]) => `${qi(c)}=${ph()}`).join(',');
    const whereSql = buildWhere(filters, params, ph, qi, likeKw);
    const sql = `UPDATE ${qi(table)} SET ${setSql}${whereSql ? ` WHERE ${whereSql}` : ''}`;
    const values = entries.map(([, v]) => encodeValue(v)).concat(params);
    await run(engine, pool, sql, values);
    return { data: null, error: null };
  }

  if (deleteOp) {
    const whereSql = buildWhere(filters, params, ph, qi, likeKw);
    const sql = `DELETE FROM ${qi(table)}${whereSql ? ` WHERE ${whereSql}` : ''}`;
    await run(engine, pool, sql, []);
    return { data: null, error: null };
  }

  // ---- Reads ----
  try {
    const cols = selectOp?.cols && selectOp.cols !== '*' ? selectOp.cols.split(',').map((c) => c.trim()) : ['*'];
    const selectSql = cols.length === 1 && cols[0] === '*' ? '*' : cols.map(qi).join(',');
    const whereSql = buildWhere(filters, params, ph, qi, likeKw);
    let sql = `SELECT ${selectSql} FROM ${qi(table)}${whereSql ? ` WHERE ${whereSql}` : ''}`;
    if (orderOp) sql += ` ORDER BY ${qi(orderOp.col)} ${orderOp.asc ? 'ASC' : 'DESC'}`;
    if (limitOp) sql += ` LIMIT ${Number(limitOp.n)}`;
    if (rangeOp) {
      const offset = Number(rangeOp.from);
      const size = Number(rangeOp.to) - offset + 1;
      if (engine === 'mysql') sql += ` LIMIT ${size} OFFSET ${offset}`;
      else sql += ` LIMIT ${size} OFFSET ${offset}`;
    }

    const rows = await run(engine, pool, sql, params);
    const numSet = numericCols.get(table);
    if (maybeSingle || single) {
      const first = rows.length > 0 ? rows[0] : null;
      return { data: first ? decodeRow(first, numSet) : null, error: null };
    }
    return { data: rows.map((r) => decodeRow(r, numSet)), error: null };
  } catch (err) {
    // Missing table on a fresh database behaves like an empty dataset.
    const msg = (err as Error).message || '';
    if (msg.toLowerCase().includes("doesn't exist") || msg.toLowerCase().includes('does not exist')) {
      return { data: [], error: null };
    }
    return { data: null, error: err };
  }
}

function buildWhere(filters: QueryOp[], params: unknown[], ph: () => string, qi: (c: string) => string, ilikeKw: string): string {
  const parts: string[] = [];
  for (const f of filters) {
    if (f.t === 'or') {
      const clauses = parseOrFilter(f.filters);
      const group = clauses.map(({ col, op, value }) => {
        switch (op) {
          case 'like':
            params.push(value);
            return `${qi(col)} LIKE ${ph()}`;
          case 'ilike': {
            params.push(value);
            return `${qi(col)} ${ilikeKw} ${ph()}`;
          }
          case 'is':
            return value === 'null' ? `${qi(col)} IS NULL` : `${qi(col)} IS NOT NULL`;
          case 'neq':
            params.push(value === 'null' ? null : value);
            return `${qi(col)} <> ${ph()}`;
          default:
            params.push(value);
            return `${qi(col)} = ${ph()}`;
        }
      });
      parts.push(`(${group.join(' OR ')})`);
      continue;
    }
    if (f.t === 'in') {
      if (f.vals.length === 0) {
        parts.push('1 = 0');
        continue;
      }
      const placeholders = f.vals.map((v) => {
        params.push(encodeValue(v));
        return ph();
      });
      parts.push(`${qi(f.col)} IN (${placeholders.join(',')})`);
      continue;
    }
    const c = f as { t: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'; col: string; val: unknown };
    const val = c.val;
    params.push(encodeValue(val));
    switch (c.t) {
      case 'eq':
        parts.push(`${qi(c.col)} = ${ph()}`);
        break;
      case 'neq':
        parts.push(`${qi(c.col)} <> ${ph()}`);
        break;
      case 'gt':
        parts.push(`${qi(c.col)} > ${ph()}`);
        break;
      case 'gte':
        parts.push(`${qi(c.col)} >= ${ph()}`);
        break;
      case 'lt':
        parts.push(`${qi(c.col)} < ${ph()}`);
        break;
      case 'lte':
        parts.push(`${qi(c.col)} <= ${ph()}`);
        break;
      case 'like':
        parts.push(`${qi(c.col)} LIKE ${ph()}`);
        break;
      case 'ilike':
        parts.push(`${qi(c.col)} ${ilikeKw} ${ph()}`);
        break;
    }
  }
  return parts.join(' AND ');
}

const mysPools = new Map<string, mysql.Pool>();
const pgPools = new Map<string, Pool>();

async function getMyPool(cfg: { host: string; port?: number; database: string; user: string; password?: string }): Promise<mysql.Pool> {
  const key = JSON.stringify(cfg);
  let p = mysPools.get(key);
  if (!p) {
    p = mysql.createPool({
      host: cfg.host,
      port: Number(cfg.port || 3306),
      database: cfg.database,
      user: cfg.user,
      password: cfg.password || '',
      connectionLimit: 5,
      waitForConnections: true,
    });
    mysPools.set(key, p);
  }
  return p;
}

async function getPgPool2(cfg: { host: string; port?: number; database: string; user: string; password?: string }): Promise<Pool> {
  const key = JSON.stringify(cfg);
  let p = pgPools.get(key);
  if (!p) {
    p = new Pool({
      host: cfg.host,
      port: Number(cfg.port || 5432),
      database: cfg.database,
      user: cfg.user,
      password: cfg.password || '',
      max: 5,
    });
    pgPools.set(key, p);
  }
  return p;
}

async function run(engine: 'mysql' | 'postgres', pool: mysql.Pool | Pool, sql: string, params: unknown[]): Promise<Row[]> {
  if (engine === 'mysql') {
    const [rows] = await (pool as mysql.Pool).query(sql, params);
    return rows as Row[];
  }
  const res = await (pool as Pool).query(sql, params);
  return res.rows as Row[];
}

// ---- Lightweight auto-migration: ensure table + columns exist for each write ----

const seenColumns = new Map<string, Set<string>>();
const seenTables = new Set<string>();

async function ensureShapes(
  engine: 'mysql' | 'postgres',
  pool: mysql.Pool | Pool,
  table: string,
  rows: Row[],
): Promise<void> {
  if (!seenTables.has(table)) {
    const createSql =
      engine === 'mysql'
        ? `CREATE TABLE IF NOT EXISTS \`${table}\` (\`id\` VARCHAR(64) PRIMARY KEY)`
        : `CREATE TABLE IF NOT EXISTS "${table}" (id TEXT PRIMARY KEY)`;
    await (pool as any).query(createSql);
    seenTables.add(table);
  }

  let existing: Set<string> = seenColumns.get(table) || new Set();
  if (existing.size === 0) {
    try {
      const cols = await fetchColumns(engine, pool, table);
      existing = cols;
      seenColumns.set(table, cols);
    } catch {
      existing = new Set();
    }
  }

  const missing = new Set<string>();
  for (const r of rows) {
    for (const c of Object.keys(r)) {
      if (!existing.has(c)) missing.add(c);
    }
  }

  for (const c of missing) {
    const alter =
      engine === 'mysql'
        ? `ALTER TABLE \`${table}\` ADD COLUMN \`${c}\` TEXT`
        : `ALTER TABLE "${table}" ADD COLUMN "${c}" TEXT`;
    try {
      await (pool as any).query(alter);
    } catch (_e) {}
    existing.add(c);
  }
  seenColumns.set(table, existing);
}

async function fetchColumns(engine: 'mysql' | 'postgres', pool: mysql.Pool | Pool, table: string): Promise<Set<string>> {
  if (engine === 'mysql') {
    const [rows] = await (pool as mysql.Pool).query(
      `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table],
    );
    return new Set((rows as Row[]).map((r) => r.name as string));
  }
  const res = await (pool as Pool).query(
    `SELECT column_name AS name FROM information_schema.columns WHERE table_name = $1`,
    [table],
  );
  return new Set(res.rows.map((r) => (r as { name: string }).name));
}

export { runSql };

export function makeAuthStub() {
  return {
    admin: {
      listUsers: async () => ({ data: null, error: { message: 'Supabase Auth is not used in local database mode.' } }),
      createUser: async () => ({ data: null, error: { message: 'Supabase Auth is not used in local database mode.' } }),
      updateUserById: async () => ({ data: null, error: null }),
      deleteUser: async () => ({ data: null, error: null }),
      getUserById: async () => ({ data: null, error: null }),
    },
    signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase Auth is not used in local database mode.' } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
  };
}

export const fallbackUuid = (): string => crypto.randomUUID();