/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const content = fs.readFileSync('src/lib/schema.ts', 'utf8');
const tablesToSkip = ['workspaces', 'schema'];
const lines = content.split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);
  const match = lines[i].match(/export const (\w+) = sqliteTable/);
  if (match) {
    const tableName = match[1];
    if (!tablesToSkip.includes(tableName)) {
      newLines.push(`  workspaceId: text('workspaceId').notNull().default('main'),`);
    }
  }
}
const schemaIndex = newLines.findIndex(l => l.startsWith('export const schema'));
newLines.splice(schemaIndex, 0, `
export const systemSettings = sqliteTable('systemSettings', {
  id: text('id').primaryKey(),
  workspaceId: text('workspaceId').notNull().default('main'),
  eggCratePriceSmall: real('eggCratePriceSmall').default(4200),
  eggCratePriceLarge: real('eggCratePriceLarge').default(4400),
  adminName: text('adminName').default('Farm Admin'),
  adminEmail: text('adminEmail').default('admin@example.com'),
  adminPhone: text('adminPhone').default('+2340000000000'),
});
`);
fs.writeFileSync('src/lib/schema.ts', newLines.join('\n'));
