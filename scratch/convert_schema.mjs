import fs from 'fs';

let content = fs.readFileSync('src/lib/schema.ts', 'utf-8');

// Replace imports
content = content.replace(
  "import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';",
  "import { pgTable, text, integer, real, boolean, json, serial } from 'drizzle-orm/pg-core';"
);

// Replace sqliteTable with pgTable
content = content.replace(/sqliteTable/g, 'pgTable');

// Replace { mode: 'boolean' } integers with boolean type
content = content.replace(/integer\('([^']+)',\s*\{\s*mode:\s*'boolean'\s*\}\)/g, "boolean('$1')");

// Replace { mode: 'json' } text with json type
content = content.replace(/text\('([^']+)',\s*\{\s*mode:\s*'json'\s*\}\)/g, "json('$1')");

// Replace integer primaryKey autoIncrement with serial
content = content.replace(/integer\('([^']+)'\)\.primaryKey\(\{\s*autoIncrement:\s*true\s*\}\)/g, "serial('$1').primaryKey()");

fs.writeFileSync('src/lib/schema.ts', content, 'utf-8');
console.log('Schema converted successfully.');
