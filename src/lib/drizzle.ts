'use strict';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { schema } from './schema';

const databaseUrl = process.env.DATABASE_URL ?? 'file:src/data/database.sqlite';
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Use a remote SQL endpoint when DATABASE_URL is set, otherwise fall back to local SQLite.
const client = createClient({
  url: databaseUrl,
  ...(authToken ? { authToken } : {}),
});

/**
 * Database instance.
 */
export const db = drizzle(client, { schema });
