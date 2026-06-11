import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const batches = sqliteTable('batches', {
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

export const eggs = sqliteTable('eggs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  goodEggs: integer('goodEggs').notNull(),
  brokenEggs: integer('brokenEggs').notNull(),
  spoiltEggs: integer('spoiltEggs').notNull(),
  batchId: text('batchId').notNull(),
});

export const feeds = sqliteTable('feeds', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'Starter' | 'Grower' | 'Finisher' | 'Layer mash'
  quantityKg: real('quantityKg').notNull(),
  supplier: text('supplier').notNull(),
  lastRestock: text('lastRestock').notNull(),
});

export const feedLogs = sqliteTable('feedLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  feedId: text('feedId').notNull(),
  quantityConsumedKg: real('quantityConsumedKg').notNull(),
  batchId: text('batchId').notNull(),
});

export const staff = sqliteTable('staff', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  salary: real('salary').notNull(),
  attendanceDays: integer('attendanceDays').notNull(),
  contact: text('contact').notNull(),
  assignedBranches: text('assignedBranches', { mode: 'json' }), // string[]
});

export const sales = sqliteTable('sales', {
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

export const expenses = sqliteTable('expenses', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  category: text('category').notNull(), // 'Feed' | 'Drugs' | 'Salaries' | 'Maintenance' | 'Utilities'
  amount: real('amount').notNull(),
  description: text('description').notNull(),
});

export const cushionAudits = sqliteTable('cushionAudits', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  boxName: text('boxName').notNull(),
  status: text('status').notNull(),
  actionTaken: text('actionTaken').notNull(),
});

export const maturationLogs = sqliteTable('maturationLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  birdId: text('birdId').notNull(),
  breed: text('breed').notNull(),
  eggsCount: integer('eggsCount').notNull(),
  avgWeightGrams: real('avgWeightGrams').notNull(),
  notes: text('notes').notNull(),
});

export const procurePipeline = sqliteTable('procurePipeline', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  milestone: text('milestone').notNull(),
  supplier: text('supplier').notNull(),
  status: text('status').notNull(),
  eta: text('eta').notNull(),
});

export const cctvLogs = sqliteTable('cctvLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  device: text('device').notNull(),
  event: text('event').notNull(),
  status: text('status').notNull(),
});

export const invoices = sqliteTable('invoices', {
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

export const tasks = sqliteTable('tasks', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  assignedTo: text('assignedTo').notNull(),
  taskName: text('taskName').notNull(),
  status: text('status').notNull(), // 'Pending' | 'Completed'
  date: text('date').notNull(),
});

export const alertSettings = sqliteTable('alertSettings', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: integer('id').primaryKey({ autoIncrement: true }),
  feedThresholdKg: real('feedThresholdKg').notNull(),
  eggDropPercentage: real('eggDropPercentage').notNull(),
  notifySms: integer('notifySms', { mode: 'boolean' }).notNull(),
  notifyEmail: integer('notifyEmail', { mode: 'boolean' }).notNull(),
  notifyWhatsapp: integer('notifyWhatsapp', { mode: 'boolean' }).notNull(),
});

export const alertLogs = sqliteTable('alertLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  message: text('message').notNull(),
  severity: text('severity').notNull(), // 'Critical' | 'Warning' | 'Info'
  read: integer('read', { mode: 'boolean' }).default(false),
});

export const mortalityLogs = sqliteTable('mortalityLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  batchId: text('batchId').notNull(),
  count: integer('count').notNull(),
  cause: text('cause').notNull(),
});

export const medicationTemplates = sqliteTable('medicationTemplates', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetType: text('targetType').notNull(), // 'Layers' | 'Broilers' | 'Chicks'
  stages: text('stages', { mode: 'json' }).notNull(), // MedicationTemplateStage[]
});

export const medicationSchedules = sqliteTable('medicationSchedules', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  batchId: text('batchId').notNull(),
  medicationName: text('medicationName').notNull(),
  type: text('type').notNull(), // 'Vaccine' | 'Medication' | 'Supplement'
  scheduledDate: text('scheduledDate').notNull(),
  status: text('status').notNull(), // 'Pending' | 'Completed'
});

export const payrollLogs = sqliteTable('payrollLogs', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  staffId: text('staffId').notNull(),
  amount: real('amount').notNull(),
  period: text('period').notNull(),
});

export const equipment = sqliteTable('equipment', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull(),
  lastMaintenance: text('lastMaintenance').notNull(),
});

export const contacts = sqliteTable('contacts', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  contactDetails: text('contactDetails').notNull(),
  totalTransactions: integer('totalTransactions').notNull(),
  notes: text('notes').notNull(),
});

export const farmPens = sqliteTable('farmPens', {
  workspaceId: text('workspaceId').notNull().default('main'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  capacity: integer('capacity').notNull(),
  currentBatchId: text('currentBatchId'),
  status: text('status').notNull(),
  temperatureLogs: text('temperatureLogs', { mode: 'json' }).notNull(),
});

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  createdAt: text('createdAt').notNull(),
});


export const systemSettings = sqliteTable('systemSettings', {
  id: text('id').primaryKey(),
  workspaceId: text('workspaceId').notNull().default('main'),
  eggCratePriceSmall: real('eggCratePriceSmall').default(4200),
  eggCratePriceLarge: real('eggCratePriceLarge').default(4400),
  adminName: text('adminName').default('Farm Admin'),
  adminEmail: text('adminEmail').default('admin@example.com'),
  adminPhone: text('adminPhone').default('+2340000000000'),
});

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
