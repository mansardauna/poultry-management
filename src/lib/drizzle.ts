import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './schema';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/postgres';

const client = postgres(databaseUrl, { prepare: false });

export const db = drizzle(client, { schema });
