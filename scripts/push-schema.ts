import { createClient } from '@libsql/client';

const url = process.env.DATABASE_URL!;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = createClient({ url, ...(authToken ? { authToken } : {}) });

const statements = [
  `CREATE TABLE IF NOT EXISTS \`alertLogs\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`message\` text NOT NULL,\`severity\` text NOT NULL,\`read\` integer DEFAULT false)`,
  `CREATE TABLE IF NOT EXISTS \`alertSettings\` (\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,\`feedThresholdKg\` real NOT NULL,\`eggDropPercentage\` real NOT NULL,\`notifySms\` integer NOT NULL,\`notifyEmail\` integer NOT NULL,\`notifyWhatsapp\` integer NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`batches\` (\`id\` text PRIMARY KEY NOT NULL,\`breed\` text NOT NULL,\`quantity\` integer NOT NULL,\`purchaseDate\` text NOT NULL,\`ageInWeeks\` integer NOT NULL,\`mortalityCount\` integer NOT NULL,\`vaccinationStatus\` text NOT NULL,\`farmSection\` text NOT NULL,\`type\` text NOT NULL,\`unitPurchasePrice\` real,\`projectedSellingPrice\` real)`,
  `CREATE TABLE IF NOT EXISTS \`cctvLogs\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`device\` text NOT NULL,\`event\` text NOT NULL,\`status\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`contacts\` (\`id\` text PRIMARY KEY NOT NULL,\`name\` text NOT NULL,\`type\` text NOT NULL,\`contactDetails\` text NOT NULL,\`totalTransactions\` integer NOT NULL,\`notes\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`cushionAudits\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`boxName\` text NOT NULL,\`status\` text NOT NULL,\`actionTaken\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`eggs\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`goodEggs\` integer NOT NULL,\`brokenEggs\` integer NOT NULL,\`spoiltEggs\` integer NOT NULL,\`batchId\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`equipment\` (\`id\` text PRIMARY KEY NOT NULL,\`name\` text NOT NULL,\`type\` text NOT NULL,\`quantity\` integer NOT NULL,\`status\` text NOT NULL,\`lastMaintenance\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`expenses\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`category\` text NOT NULL,\`amount\` real NOT NULL,\`description\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`farmPens\` (\`id\` text PRIMARY KEY NOT NULL,\`name\` text NOT NULL,\`capacity\` integer NOT NULL,\`currentBatchId\` text,\`status\` text NOT NULL,\`temperatureLogs\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`feedLogs\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`feedId\` text NOT NULL,\`quantityConsumedKg\` real NOT NULL,\`batchId\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`feeds\` (\`id\` text PRIMARY KEY NOT NULL,\`type\` text NOT NULL,\`quantityKg\` real NOT NULL,\`supplier\` text NOT NULL,\`lastRestock\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`invoices\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`saleId\` text NOT NULL,\`customerName\` text NOT NULL,\`items\` text NOT NULL,\`quantity\` integer NOT NULL,\`unitPrice\` real NOT NULL,\`totalAmount\` real NOT NULL,\`status\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`maturationLogs\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`birdId\` text NOT NULL,\`breed\` text NOT NULL,\`eggsCount\` integer NOT NULL,\`avgWeightGrams\` real NOT NULL,\`notes\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`medicationSchedules\` (\`id\` text PRIMARY KEY NOT NULL,\`batchId\` text NOT NULL,\`medicationName\` text NOT NULL,\`type\` text NOT NULL,\`scheduledDate\` text NOT NULL,\`status\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`medicationTemplates\` (\`id\` text PRIMARY KEY NOT NULL,\`name\` text NOT NULL,\`targetType\` text NOT NULL,\`stages\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`mortalityLogs\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`batchId\` text NOT NULL,\`count\` integer NOT NULL,\`cause\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`payrollLogs\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`staffId\` text NOT NULL,\`amount\` real NOT NULL,\`period\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`procurePipeline\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`milestone\` text NOT NULL,\`supplier\` text NOT NULL,\`status\` text NOT NULL,\`eta\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`sales\` (\`id\` text PRIMARY KEY NOT NULL,\`date\` text NOT NULL,\`type\` text NOT NULL,\`quantity\` integer NOT NULL,\`totalAmount\` real NOT NULL,\`customerName\` text NOT NULL,\`paymentMethod\` text NOT NULL,\`status\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`staff\` (\`id\` text PRIMARY KEY NOT NULL,\`name\` text NOT NULL,\`role\` text NOT NULL,\`salary\` real NOT NULL,\`attendanceDays\` integer NOT NULL,\`contact\` text NOT NULL,\`assignedBranches\` text)`,
  `CREATE TABLE IF NOT EXISTS \`tasks\` (\`id\` text PRIMARY KEY NOT NULL,\`assignedTo\` text NOT NULL,\`taskName\` text NOT NULL,\`status\` text NOT NULL,\`date\` text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS \`workspaces\` (\`id\` text PRIMARY KEY NOT NULL,\`name\` text NOT NULL,\`type\` text NOT NULL,\`createdAt\` text NOT NULL)`,
];

async function main() {
  console.log('Connecting to:', url);
  for (const sql of statements) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/)?.[1];
    try {
      await client.execute(sql);
      console.log(`✓ ${tableName}`);
    } catch (err: any) {
      console.error(`✗ ${tableName}: ${err.message}`);
    }
  }
  console.log('\n✅ Schema push complete!');
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
