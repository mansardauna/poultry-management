import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL ?? './src/data/database.sqlite';
const databaseDialect = (process.env.DATABASE_DIALECT ?? (databaseUrl.startsWith('http') ? 'turso' : 'sqlite')) as 'sqlite' | 'turso';
const dbCredentials = databaseDialect === 'turso'
  ? { url: databaseUrl, authToken: process.env.DATABASE_AUTH_TOKEN }
  : { url: databaseUrl };

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './src/data/migrations',
  dialect: databaseDialect,
  dbCredentials,
  verbose: true,
  strict: true,
});
