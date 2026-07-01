'use strict';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { schema } from './schema';

const databaseUrl = 'file:src/data/database.sqlite';

// Use strictly local SQLite file to ensure no remote database connections are made.
const client = createClient({
  url: databaseUrl,
});

/**
 * Database instance.
 */
export const db = drizzle(client, { schema });
