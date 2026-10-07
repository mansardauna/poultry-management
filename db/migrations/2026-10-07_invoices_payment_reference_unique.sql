-- Migration: enforce single-use invoice payment references.
-- `CREATE TABLE IF NOT EXISTS` in schema.sql does NOT add this index to databases created earlier,
-- so run the statement for your engine once against existing deployments.
--
-- 1) Find duplicates first (must be resolved before the index can be created):
--    SELECT paymentReference, COUNT(*) FROM invoices
--    WHERE paymentReference IS NOT NULL GROUP BY paymentReference HAVING COUNT(*) > 1;

-- MySQL / MariaDB
ALTER TABLE `invoices` ADD UNIQUE KEY `uq_invoices_paymentReference` (`paymentReference`);

-- PostgreSQL / Supabase (use instead of the MySQL statement above)
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_invoices_paymentReference ON invoices ("paymentReference");
