CREATE TABLE "alertLogs" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"message" text NOT NULL,
	"severity" text NOT NULL,
	"read" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "alertSettings" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"feedThresholdKg" real NOT NULL,
	"eggDropPercentage" real NOT NULL,
	"notifySms" boolean NOT NULL,
	"notifyEmail" boolean NOT NULL,
	"notifyWhatsapp" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"breed" text NOT NULL,
	"quantity" integer NOT NULL,
	"purchaseDate" text NOT NULL,
	"ageInWeeks" integer NOT NULL,
	"mortalityCount" integer NOT NULL,
	"vaccinationStatus" text NOT NULL,
	"farmSection" text NOT NULL,
	"type" text NOT NULL,
	"unitPurchasePrice" real,
	"projectedSellingPrice" real
);
--> statement-breakpoint
CREATE TABLE "cctvLogs" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"device" text NOT NULL,
	"event" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"contactDetails" text NOT NULL,
	"totalTransactions" integer NOT NULL,
	"notes" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cushionAudits" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"boxName" text NOT NULL,
	"status" text NOT NULL,
	"actionTaken" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eggs" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"goodEggs" integer NOT NULL,
	"brokenEggs" integer NOT NULL,
	"spoiltEggs" integer NOT NULL,
	"batchId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"status" text NOT NULL,
	"lastMaintenance" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"category" text NOT NULL,
	"amount" real NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farmPens" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"currentBatchId" text,
	"status" text NOT NULL,
	"temperatureLogs" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedLogs" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"feedId" text NOT NULL,
	"quantityConsumedKg" real NOT NULL,
	"batchId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"quantityKg" real NOT NULL,
	"supplier" text NOT NULL,
	"lastRestock" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"saleId" text NOT NULL,
	"customerName" text NOT NULL,
	"items" text NOT NULL,
	"quantity" integer NOT NULL,
	"unitPrice" real NOT NULL,
	"totalAmount" real NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maturationLogs" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"birdId" text NOT NULL,
	"breed" text NOT NULL,
	"eggsCount" integer NOT NULL,
	"avgWeightGrams" real NOT NULL,
	"notes" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicationSchedules" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"batchId" text NOT NULL,
	"medicationName" text NOT NULL,
	"type" text NOT NULL,
	"scheduledDate" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicationTemplates" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"targetType" text NOT NULL,
	"stages" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mortalityLogs" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"batchId" text NOT NULL,
	"count" integer NOT NULL,
	"cause" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payrollLogs" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"staffId" text NOT NULL,
	"amount" real NOT NULL,
	"period" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procurePipeline" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"milestone" text NOT NULL,
	"supplier" text NOT NULL,
	"status" text NOT NULL,
	"eta" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"totalAmount" real NOT NULL,
	"customerName" text NOT NULL,
	"paymentMethod" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"salary" real NOT NULL,
	"attendanceDays" integer NOT NULL,
	"contact" text NOT NULL,
	"assignedBranches" json
);
--> statement-breakpoint
CREATE TABLE "systemSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"eggCratePriceSmall" real DEFAULT 4200,
	"eggCratePriceLarge" real DEFAULT 4400,
	"adminName" text DEFAULT 'Farm Admin',
	"adminEmail" text DEFAULT 'admin@example.com',
	"adminPhone" text DEFAULT '+2340000000000'
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"workspaceId" text DEFAULT 'main' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"assignedTo" text NOT NULL,
	"taskName" text NOT NULL,
	"status" text NOT NULL,
	"date" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"createdAt" text NOT NULL
);
