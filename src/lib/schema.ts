'use strict';
import { pgTable, text, integer, real, boolean, json, serial } from 'drizzle-orm/pg-core';

/**
 * @constant
 */
export const batches = pgTable('batches', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  breed: text('breed').notNull(),
  quantity: integer('quantity').notNull(),
  purchaseDate: text('purchaseDate').notNull(),
  ageInWeeks: integer('ageInWeeks').notNull(),
  mortalityCount: integer('mortalityCount').notNull(),
  vaccinationStatus: text('vaccinationStatus').notNull(),
  farmSection: text('farmSection').notNull(),
  type: text('type').notNull(), // 'Layers' | 'Broilers' | 'Chicks'
  unitPurchasePrice: real('unitPurchasePrice'),
  projectedSellingPrice: real('projectedSellingPrice'),
});

/**
 * @constant
 */
export const eggs = pgTable('eggs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  goodEggs: integer('goodEggs').notNull(),
  brokenEggs: integer('brokenEggs').notNull(),
  spoiltEggs: integer('spoiltEggs').notNull(),
  batchId: text('batchId').notNull(),
});

/**
 * @constant
 */
export const feeds = pgTable('feeds', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'Starter' | 'Grower' | 'Finisher' | 'Layer mash'
  quantityKg: real('quantityKg').notNull(),
  supplier: text('supplier').notNull(),
  lastRestock: text('lastRestock').notNull(),
});

/**
 * @constant
 */
export const feedLogs = pgTable('feedLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  feedId: text('feedId').notNull(),
  quantityConsumedKg: real('quantityConsumedKg').notNull(),
  batchId: text('batchId').notNull(),
});

/**
 * @constant
 */
export const staff = pgTable('staff', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  salary: real('salary').notNull(),
  attendanceDays: integer('attendanceDays').notNull(),
  contact: text('contact').notNull(),
  assignedBranches: json('assignedBranches'), // string[]
});

/**
 * @constant
 */
export const sales = pgTable('sales', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  type: text('type').notNull(), // 'Eggs' | 'Chickens' | 'Feed'
  quantity: integer('quantity').notNull(),
  totalAmount: real('totalAmount').notNull(),
  customerName: text('customerName').notNull(),
  paymentMethod: text('paymentMethod').notNull(), // 'Cash' | 'Bank transfer' | 'POS'
  status: text('status').notNull(), // 'Paid' | 'Pending'
});

/**
 * @constant
 */
export const expenses = pgTable('expenses', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  category: text('category').notNull(), // 'Feed' | 'Drugs' | 'Salaries' | 'Maintenance' | 'Utilities'
  amount: real('amount').notNull(),
  description: text('description').notNull(),
});

/**
 * @constant
 */
export const cushionAudits = pgTable('cushionAudits', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  boxName: text('boxName').notNull(),
  status: text('status').notNull(),
  actionTaken: text('actionTaken').notNull(),
});

/**
 * @constant
 */
export const maturationLogs = pgTable('maturationLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  birdId: text('birdId').notNull(),
  breed: text('breed').notNull(),
  eggsCount: integer('eggsCount').notNull(),
  avgWeightGrams: real('avgWeightGrams').notNull(),
  notes: text('notes').notNull(),
});

/**
 * @constant
 */
export const procurePipeline = pgTable('procurePipeline', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  milestone: text('milestone').notNull(),
  supplier: text('supplier').notNull(),
  status: text('status').notNull(),
  eta: text('eta').notNull(),
});

/**
 * @constant
 */
export const cctvLogs = pgTable('cctvLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  device: text('device').notNull(),
  event: text('event').notNull(),
  status: text('status').notNull(),
});

/**
 * @constant
 */
export const invoices = pgTable('invoices', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  saleId: text('saleId').notNull(),
  customerName: text('customerName').notNull(),
  items: text('items').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unitPrice').notNull(),
  totalAmount: real('totalAmount').notNull(),
  status: text('status').notNull(), // 'Paid' | 'Pending' | 'Overdue'
});

/**
 * @constant
 */
export const tasks = pgTable('tasks', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  assignedTo: text('assignedTo').notNull(),
  taskName: text('taskName').notNull(),
  status: text('status').notNull(), // 'Pending' | 'Completed'
  date: text('date').notNull(),
});

/**
 * @constant
 */
export const alertSettings = pgTable('alertSettings', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: serial('id').primaryKey(),
  feedThresholdKg: real('feedThresholdKg').notNull(),
  eggDropPercentage: real('eggDropPercentage').notNull(),
  notifySms: boolean('notifySms').notNull(),
  notifyEmail: boolean('notifyEmail').notNull(),
  notifyWhatsapp: boolean('notifyWhatsapp').notNull(),
});

/**
 * @constant
 */
export const alertLogs = pgTable('alertLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  message: text('message').notNull(),
  severity: text('severity').notNull(), // 'Critical' | 'Warning' | 'Info'
  read: boolean('read').default(false),
});

/**
 * @constant
 */
export const mortalityLogs = pgTable('mortalityLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  batchId: text('batchId').notNull(),
  count: integer('count').notNull(),
  cause: text('cause').notNull(),
});

/**
 * @constant
 */
export const medicationTemplates = pgTable('medicationTemplates', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetType: text('targetType').notNull(), // 'Layers' | 'Broilers' | 'Chicks'
  stages: json('stages').notNull(), // MedicationTemplateStage[]
});

/**
 * @constant
 */
export const medicationSchedules = pgTable('medicationSchedules', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  batchId: text('batchId').notNull(),
  medicationName: text('medicationName').notNull(),
  type: text('type').notNull(), // 'Vaccine' | 'Medication' | 'Supplement'
  scheduledDate: text('scheduledDate').notNull(),
  status: text('status').notNull(), // 'Pending' | 'Completed'
});

/**
 * @constant
 */
export const payrollLogs = pgTable('payrollLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  staffId: text('staffId').notNull(),
  amount: real('amount').notNull(),
  period: text('period').notNull(),
});

/**
 * @constant
 */
export const equipment = pgTable('equipment', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull(),
  lastMaintenance: text('lastMaintenance').notNull(),
});

/**
 * @constant
 */
export const contacts = pgTable('contacts', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  contactDetails: text('contactDetails').notNull(),
  totalTransactions: integer('totalTransactions').notNull(),
  notes: text('notes').notNull(),
});

/**
 * @constant
 */
export const farmPens = pgTable('farmPens', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  capacity: integer('capacity').notNull(),
  currentBatchId: text('currentBatchId'),
  status: text('status').notNull(),
  temperatureLogs: json('temperatureLogs').notNull(),
});

/**
 * @constant
 */
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  createdAt: text('createdAt').notNull(),
});


/**
 * @constant
 */
export const systemSettings = pgTable('systemSettings', {
  id: text('id').primaryKey(),
  workspaceId: text('workspaceId').notNull().default('main'),
  eggCratePriceSmall: real('eggCratePriceSmall').default(4200),
  eggCratePriceLarge: real('eggCratePriceLarge').default(4400),
  adminName: text('adminName').default('Farm Admin'),
  adminEmail: text('adminEmail').default('admin@example.com'),
  adminPhone: text('adminPhone').default('+2340000000000'),
});

/**
 * Database schema.
 */
/**
 * @constant
 */
export const schema = {
  batches,
  eggs,
  feeds,
  feedLogs,
  staff,
  sales,
  expenses,
  cushionAudits,
  maturationLogs,
  procurePipeline,
  cctvLogs,
  invoices,
  tasks,
  alertSettings,
  alertLogs,
  mortalityLogs,
  medicationTemplates,
  medicationSchedules,
  payrollLogs,
  equipment,
  contacts,
  farmPens,
  workspaces,
  systemSettings,
};
