'use strict';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  username: string;
}

interface StoredUserRow {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  role: string;
  workspaceId: string | null;
}

export interface DatabaseConfig {
  engine: 'supabase' | 'mysql' | 'postgres';
  mysql?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  postgres?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  updatedAt?: string;
}

let cachedConfig: DatabaseConfig | null | undefined;

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function loadDatabaseConfig(): Promise<DatabaseConfig | null> {
  if (cachedConfig !== undefined) return cachedConfig;
  try {
    const raw = await fs.readFile(configFilePath(), 'utf8');
    cachedConfig = JSON.parse(raw) as DatabaseConfig;
  } catch {
    cachedConfig = null;
  }
  return cachedConfig;
}

export function resetDatabaseConfigCache(): void {
  cachedConfig = undefined;
}

export async function saveDatabaseConfig(config: DatabaseConfig): Promise<void> {
  cachedConfig = config;
  const dir = path.join(process.cwd(), 'data');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(configFilePath(), JSON.stringify(config, null, 2), { mode: 0o600 });
}

export async function isSupabaseMode(): Promise<boolean> {
  const cfg = await loadDatabaseConfig();
  return !cfg || cfg.engine === 'supabase';
}

function configFilePath(): string {
  return path.join(process.cwd(), 'data', 'database.config.json');
}

// ---- Password hashing (bcrypt, no new dependency) ----

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

// ---- Engine connectivity ----

const mysqlPools = new Map<string, mysql.Pool>();
const pgPools = new Map<string, Pool>();

export async function getMysqlPool(cfg: DatabaseConfig): Promise<mysql.Pool> {
  const key = JSON.stringify(cfg.mysql);
  let pool = mysqlPools.get(key);
  if (!pool) {
    pool = mysql.createPool({
      host: cfg.mysql!.host,
      port: Number(cfg.mysql!.port || 3306),
      database: cfg.mysql!.database,
      user: cfg.mysql!.user,
      password: cfg.mysql!.password || '',
      connectionLimit: 3,
      waitForConnections: true,
    });
    mysqlPools.set(key, pool);
  }
  return pool;
}

export async function getPgPool(cfg: DatabaseConfig): Promise<Pool> {
  const key = JSON.stringify(cfg.postgres);
  let pool = pgPools.get(key);
  if (!pool) {
    pool = new Pool({
      host: cfg.postgres!.host,
      port: Number(cfg.postgres!.port || 5432),
      database: cfg.postgres!.database,
      user: cfg.postgres!.user,
      password: cfg.postgres!.password || '',
      max: 3,
    });
    pgPools.set(key, pool);
  }
  return pool;
}

function newId(): string {
  return crypto.randomUUID();
}

// ---- Schema (created on first use, so install works on a fresh database) ----

const USERS_TABLE_SQL_MYSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'Staff',
    workspaceId VARCHAR(128) NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_username (username)
  )`;

const SESSIONS_TABLE_SQL_MYSQL = `
  CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(128) PRIMARY KEY,
    userId VARCHAR(64) NOT NULL,
    role VARCHAR(64) NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    expiresAt BIGINT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

const USERS_TABLE_SQL_PG = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT,
    "passwordHash" TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Staff',
    "workspaceId" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
  )`;

const SESSIONS_TABLE_SQL_PG = `
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    role TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    "expiresAt" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT now()
  )`;

export async function ensureAuthSchema(cfg: DatabaseConfig): Promise<void> {
  if (cfg.engine === 'mysql') {
    const pool = await getMysqlPool(cfg);
    await pool.query(USERS_TABLE_SQL_MYSQL);
    await pool.query(SESSIONS_TABLE_SQL_MYSQL);
  } else if (cfg.engine === 'postgres') {
    const pool = await getPgPool(cfg);
    await pool.query(USERS_TABLE_SQL_PG);
    await pool.query(SESSIONS_TABLE_SQL_PG);
  }
}

// ---- User lookups ----

export async function findUserByLogin(
  cfg: DatabaseConfig,
  login: string,
): Promise<AuthUser & { passwordHash: string } | null> {
  const email = login.includes('@') ? login : '';
  const username = login.includes('@') ? login.split('@')[0] : login;

  if (cfg.engine === 'mysql') {
    const pool = await getMysqlPool(cfg);
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT id, username, email, passwordHash, role, workspaceId FROM users WHERE email = ? OR username = ? OR username = ? LIMIT 1',
      [login, login, username],
    );
    const r = rows[0] as unknown as StoredUserRow | undefined;
    if (!r) return null;
    return { id: r.id, email: r.email || login, role: r.role, username: r.username, passwordHash: r.passwordHash };
  }

  if (cfg.engine === 'postgres') {
    const pool = await getPgPool(cfg);
    const { rows } = await pool.query<StoredUserRow>(
      'SELECT id, username, email, "passwordHash", role, "workspaceId" FROM users WHERE email = $1 OR username = $1 OR username = $2 LIMIT 1',
      [login, username],
    );
    const r = rows[0];
    if (!r) return null;
    return { id: r.id, email: r.email || login, role: r.role, username: r.username, passwordHash: r.passwordHash };
  }

  return null;
}

export async function upsertSuperAdmin(cfg: DatabaseConfig, email: string, password: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const username = cleanEmail.split('@')[0];
  const passwordHash = hashPassword(password);
  const id = newId();

  if (cfg.engine === 'mysql') {
    const pool = await getMysqlPool(cfg);
    const existing = await findUserByLogin(cfg, cleanEmail);
    if (existing) {
      await pool.query('UPDATE users SET passwordHash = ?, role = ?, email = ?, username = ? WHERE email = ? OR username = ?', [
        passwordHash, 'SuperAdmin', cleanEmail, username, cleanEmail, cleanEmail,
      ]);
    } else {
      await pool.query(
        'INSERT INTO users (id, username, email, passwordHash, role, workspaceId) VALUES (?, ?, ?, ?, ?, ?)',
        [id, username, cleanEmail, passwordHash, 'SuperAdmin', 'main-org_owner_main'],
      );
    }
  } else if (cfg.engine === 'postgres') {
    const pool = await getPgPool(cfg);
    const existing = await findUserByLogin(cfg, cleanEmail);
    if (existing) {
      await pool.query(
        'UPDATE users SET "passwordHash" = $1, role = $2, email = $3, username = $4 WHERE email = $3',
        [passwordHash, 'SuperAdmin', cleanEmail, username],
      );
    } else {
      await pool.query(
        'INSERT INTO users (id, username, email, "passwordHash", role, "workspaceId") VALUES ($1, $2, $3, $4, $5, $6)',
        [id, username, cleanEmail, passwordHash, 'SuperAdmin', 'main-org_owner_main'],
      );
    }
  }
}

// ---- Sessions ----

export async function createSession(cfg: DatabaseConfig, user: AuthUser): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;

  if (cfg.engine === 'mysql') {
    const pool = await getMysqlPool(cfg);
    await pool.query(
      'INSERT INTO sessions (token, userId, role, username, email, expiresAt) VALUES (?, ?, ?, ?, ?, ?)',
      [token, user.id, user.role, user.username, user.email, expiresAt],
    );
  } else if (cfg.engine === 'postgres') {
    const pool = await getPgPool(cfg);
    await pool.query(
      'INSERT INTO sessions (token, "userId", role, username, email, "expiresAt") VALUES ($1, $2, $3, $4, $5, $6)',
      [token, user.id, user.role, user.username, user.email, expiresAt],
    );
  }

  return token;
}

export async function getUserBySessionToken(cfg: DatabaseConfig, token: string): Promise<AuthUser | null> {
  const now = Date.now();

  if (cfg.engine === 'mysql') {
    const pool = await getMysqlPool(cfg);
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT s.token, s.userId, s.role, s.username, s.email, s.expiresAt FROM sessions s WHERE s.token = ? LIMIT 1',
      [token],
    );
    const r = rows[0] as { token: string; userId: string; role: string; username: string; email: string | null; expiresAt: number } | undefined;
    if (!r) return null;
    if (r.expiresAt < now) {
      await pool.query('DELETE FROM sessions WHERE token = ?', [token]).catch(() => {});
      return null;
    }
    return { id: r.userId, email: r.email || r.username, role: r.role, username: r.username };
  }

  if (cfg.engine === 'postgres') {
    const pool = await getPgPool(cfg);
    const { rows } = await pool.query<{ token: string; userId: string; role: string; username: string; email: string | null; expiresAt: number }>(
      'SELECT token, "userId", role, username, email, "expiresAt" FROM sessions WHERE token = $1 LIMIT 1',
      [token],
    );
    const r = rows[0];
    if (!r) return null;
    if (r.expiresAt < now) {
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]).catch(() => {});
      return null;
    }
    return { id: r.userId, email: r.email || r.username, role: r.role, username: r.username };
  }

  return null;
}

export async function deleteSession(cfg: DatabaseConfig, token: string): Promise<void> {
  if (cfg.engine === 'mysql') {
    const pool = await getMysqlPool(cfg);
    await pool.query('DELETE FROM sessions WHERE token = ?', [token]).catch(() => {});
  } else if (cfg.engine === 'postgres') {
    const pool = await getPgPool(cfg);
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]).catch(() => {});
  }
}

export async function findUserById(cfg: DatabaseConfig, id: string): Promise<AuthUser | null> {
  if (cfg.engine === 'mysql') {
    const pool = await getMysqlPool(cfg);
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT id, username, email, role FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    const r = rows[0] as { id: string; username: string; email: string | null; role: string } | undefined;
    if (!r) return null;
    return { id: r.id, email: r.email || r.username, role: r.role, username: r.username };
  }
  if (cfg.engine === 'postgres') {
    const pool = await getPgPool(cfg);
    const { rows } = await pool.query<{ id: string; username: string; email: string | null; role: string }>(
      'SELECT id, username, email, role FROM users WHERE id = $1 LIMIT 1',
      [id],
    );
    const r = rows[0];
    if (!r) return null;
    return { id: r.id, email: r.email || r.username, role: r.role, username: r.username };
  }
  return null;
}

export async function updateUserPasswordById(cfg: DatabaseConfig, id: string, newPassword: string): Promise<void> {
  const passwordHash = hashPassword(newPassword);
  if (cfg.engine === 'mysql') {
    const pool = await getMysqlPool(cfg);
    await pool.query('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, id]);
  } else if (cfg.engine === 'postgres') {
    const pool = await getPgPool(cfg);
    await pool.query('UPDATE users SET "passwordHash" = $1 WHERE id = $2', [passwordHash, id]);
  }
}