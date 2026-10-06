-- Poultry Management System (PMS)
-- Database Schema Definition (MySQL & PostgreSQL compatible ANSI SQL)

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `username` VARCHAR(255),
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(64) NOT NULL DEFAULT 'FarmAdmin',
  `orgId` VARCHAR(64),
  `workspaceId` VARCHAR(64),
  `status` VARCHAR(64) DEFAULT 'active',
  `phone` VARCHAR(64),
  `createdBy` VARCHAR(64),
  `twoFactorEnabled` TINYINT(1) DEFAULT 0,
  `twoFactorSecret` VARCHAR(255),
  `subscriptionTier` VARCHAR(64) DEFAULT 'free',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_orgId` (`orgId`),
  INDEX `idx_users_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `organizations` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255),
  `plan` VARCHAR(64) DEFAULT 'starter',
  `status` VARCHAR(64) DEFAULT 'active',
  `ownerEmail` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `workspaces` (
  `id` VARCHAR(64) PRIMARY KEY,
  `orgId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255),
  `tier` VARCHAR(64) DEFAULT 'free',
  `subscriptionPlan` VARCHAR(64) DEFAULT 'Starter',
  `subscriptionStatus` VARCHAR(64) DEFAULT 'active',
  `isCurrent` TINYINT(1) DEFAULT 1,
  `metadata` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workspaces_orgId` (`orgId`)
);

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `plan` VARCHAR(64) NOT NULL,
  `status` VARCHAR(64) NOT NULL DEFAULT 'active',
  `billingCycle` VARCHAR(32) DEFAULT 'monthly',
  `startDate` VARCHAR(64),
  `endDate` VARCHAR(64),
  `amount` DECIMAL(12, 2) DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_subscriptions_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(128) PRIMARY KEY,
  `userId` VARCHAR(64) NOT NULL,
  `token` VARCHAR(512),
  `expiresAt` DATETIME,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sessions_userId` (`userId`)
);

CREATE TABLE IF NOT EXISTS `batches` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `breed` VARCHAR(128) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `purchaseDate` VARCHAR(64),
  `ageInWeeks` INT DEFAULT 1,
  `mortalityCount` INT DEFAULT 0,
  `vaccinationStatus` VARCHAR(64) DEFAULT 'Up to Date',
  `farmSection` VARCHAR(128) DEFAULT 'Section A',
  `type` VARCHAR(64) DEFAULT 'Layers',
  `unitPurchasePrice` DECIMAL(12, 2),
  `projectedSellingPrice` DECIMAL(12, 2),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_batches_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `eggs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `batchId` VARCHAR(64),
  `date` VARCHAR(64),
  `goodEggs` INT DEFAULT 0,
  `badEggs` INT DEFAULT 0,
  `totalEggs` INT DEFAULT 0,
  `damagedEggs` INT DEFAULT 0,
  `crates` DECIMAL(10, 2) DEFAULT 0,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_eggs_workspaceId` (`workspaceId`),
  INDEX `idx_eggs_batchId` (`batchId`)
);

CREATE TABLE IF NOT EXISTS `feeds` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `type` VARCHAR(128) NOT NULL,
  `quantityKg` DECIMAL(12, 2) DEFAULT 0,
  `supplier` VARCHAR(255),
  `lastRestock` VARCHAR(64),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_feeds_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `feedLogs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64),
  `feedId` VARCHAR(64),
  `quantityConsumedKg` DECIMAL(12, 2) DEFAULT 0,
  `batchId` VARCHAR(64),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_feedLogs_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `procurePipeline` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64),
  `milestone` VARCHAR(255),
  `supplier` VARCHAR(255),
  `status` VARCHAR(64) DEFAULT 'Under Negotiations',
  `eta` VARCHAR(64) DEFAULT 'Pending',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_procurePipeline_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `sales` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64),
  `type` VARCHAR(64) DEFAULT 'Eggs',
  `quantity` INT DEFAULT 0,
  `totalAmount` DECIMAL(12, 2) DEFAULT 0,
  `customerName` VARCHAR(255),
  `paymentMethod` VARCHAR(64) DEFAULT 'Cash',
  `status` VARCHAR(64) DEFAULT 'Paid',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sales_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64),
  `saleId` VARCHAR(64),
  `customerName` VARCHAR(255),
  `items` TEXT,
  `quantity` INT DEFAULT 1,
  `unitPrice` DECIMAL(12, 2) DEFAULT 0,
  `totalAmount` DECIMAL(12, 2) DEFAULT 0,
  `status` VARCHAR(64) DEFAULT 'Unpaid',
  `paymentReference` VARCHAR(255) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_invoices_workspaceId` (`workspaceId`),
  UNIQUE KEY `uq_invoices_paymentReference` (`paymentReference`)
);

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64),
  `category` VARCHAR(128) DEFAULT 'Feed',
  `amount` DECIMAL(12, 2) DEFAULT 0,
  `description` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_expenses_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `payrollLogs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64),
  `staffId` VARCHAR(64),
  `amount` DECIMAL(12, 2) DEFAULT 0,
  `period` VARCHAR(64),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_payrollLogs_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `staff` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(128) DEFAULT 'Worker',
  `salary` DECIMAL(12, 2) DEFAULT 0,
  `attendanceDays` INT DEFAULT 0,
  `contact` VARCHAR(64),
  `email` VARCHAR(255),
  `password` VARCHAR(255),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_staff_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `equipment` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(128) DEFAULT 'Other',
  `quantity` INT DEFAULT 1,
  `status` VARCHAR(64) DEFAULT 'Good',
  `lastMaintenance` VARCHAR(64),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_equipment_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `farmPens` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `capacity` INT DEFAULT 0,
  `currentBatchId` VARCHAR(64),
  `status` VARCHAR(64) DEFAULT 'Active',
  `temperatureLogs` TEXT,
  `tempMin` DECIMAL(5, 2) DEFAULT NULL,
  `tempMax` DECIMAL(5, 2) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_farmPens_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `mortalityLogs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64),
  `batchId` VARCHAR(64),
  `count` INT DEFAULT 0,
  `cause` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mortalityLogs_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `medicationTemplates` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `targetType` VARCHAR(128),
  `stages` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_medicationTemplates_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `medicationSchedules` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `batchId` VARCHAR(64),
  `medicationName` VARCHAR(255),
  `type` VARCHAR(128),
  `scheduledDate` VARCHAR(64),
  `status` VARCHAR(64) DEFAULT 'Pending',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_medicationSchedules_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `assignedTo` VARCHAR(255),
  `taskName` VARCHAR(255),
  `status` VARCHAR(64) DEFAULT 'Pending',
  `date` VARCHAR(64),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tasks_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `alertLogs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64),
  `message` TEXT,
  `severity` VARCHAR(64) DEFAULT 'Info',
  `read` TINYINT(1) DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_alertLogs_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `alertSettings` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `feedThresholdKg` DECIMAL(10, 2) DEFAULT 50,
  `mortalityThreshold` INT DEFAULT 5,
  `tempMin` DECIMAL(5, 2) DEFAULT 18.0,
  `tempMax` DECIMAL(5, 2) DEFAULT 28.0,
  `eggDropPercentage` DECIMAL(5, 2) DEFAULT 15.00,
  `minDailyEggCount` INT DEFAULT 0,
  `notifySms` TINYINT(1) DEFAULT 0,
  `notifyEmail` TINYINT(1) DEFAULT 1,
  `notifyWhatsapp` TINYINT(1) DEFAULT 1,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_alertSettings_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `cctvLogs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64),
  `device` VARCHAR(255),
  `event` TEXT,
  `status` VARCHAR(64) DEFAULT 'Healthy',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cctvLogs_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `cctv_cameras` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workspaceId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `cameraId` VARCHAR(255),
  `streamUrl` TEXT,
  `streamType` VARCHAR(64) DEFAULT 'RTSP',
  `status` VARCHAR(64) DEFAULT 'Online',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_cctv_cameras_workspaceId` (`workspaceId`)
);

CREATE TABLE IF NOT EXISTS `systemSettings` (
  `id` VARCHAR(64) PRIMARY KEY,
  `key` VARCHAR(128) NOT NULL UNIQUE,
  `value` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- IDEMPOTENT MIGRATIONS FOR EXISTING INSTALLATIONS
-- Run these statements on existing databases to upgrade them safely:
-- ============================================================================
-- MySQL 8.0+ / MariaDB / PostgreSQL compatible idempotent alterations:
-- ALTER TABLE `alertSettings` ADD COLUMN IF NOT EXISTS `eggDropPercentage` DECIMAL(5, 2) DEFAULT 15.00;
-- ALTER TABLE `alertSettings` ADD COLUMN IF NOT EXISTS `minDailyEggCount` INT DEFAULT 0;
-- ALTER TABLE `alertSettings` ADD COLUMN IF NOT EXISTS `tempMin` DECIMAL(5, 2) DEFAULT 18.0;
-- ALTER TABLE `alertSettings` ADD COLUMN IF NOT EXISTS `tempMax` DECIMAL(5, 2) DEFAULT 28.0;
-- ALTER TABLE `alertSettings` ADD COLUMN IF NOT EXISTS `notifySms` TINYINT(1) DEFAULT 0;
-- ALTER TABLE `alertSettings` ADD COLUMN IF NOT EXISTS `notifyEmail` TINYINT(1) DEFAULT 1;
-- ALTER TABLE `alertSettings` ADD COLUMN IF NOT EXISTS `notifyWhatsapp` TINYINT(1) DEFAULT 1;
-- ALTER TABLE `farmPens` ADD COLUMN IF NOT EXISTS `tempMin` DECIMAL(5, 2) DEFAULT NULL;
-- ALTER TABLE `farmPens` ADD COLUMN IF NOT EXISTS `tempMax` DECIMAL(5, 2) DEFAULT NULL;

