'use strict';
/**
 * @interface
 */
export interface ChickenBatch {
  id: string;
  breed: string;
  quantity: number;
  purchaseDate: string;
  ageInWeeks: number;
  mortalityCount: number;
  vaccinationStatus: string;
  farmSection: string;
  type: string; // 'Layers' | 'Broilers' | 'Chicks'
  unitPurchasePrice?: number | null;
  projectedSellingPrice?: number | null;
}

/**
 * @interface
 */
export interface EggRecord {
  id: string;
  date: string;
  goodEggs: number;
  brokenEggs: number;
  spoiltEggs: number;
  batchId: string;
}

/**
 * @interface
 */
export interface FeedInventory {
  id: string;
  type: string; // 'Starter' | 'Grower' | 'Finisher' | 'Layer mash'
  quantityKg: number;
  supplier: string;
  lastRestock: string;
}

/**
 * @interface
 */
export interface DailyFeedLog {
  id: string;
  date: string;
  feedId: string;
  quantityConsumedKg: number;
  batchId: string;
}

/**
 * @interface
 */
export interface Staff {
  id: string;
  name: string;
  role: string;
  salary: number;
  attendanceDays: number;
  contact: string;
  assignedBranches?: unknown; // string[]
}

/**
 * @interface
 */
export interface Sale {
  id: string;
  date: string;
  type: string; // 'Eggs' | 'Chickens' | 'Feed'
  quantity: number;
  totalAmount: number;
  customerName: string;
  paymentMethod: string; // 'Cash' | 'Bank transfer' | 'POS'
  status: string; // 'Paid' | 'Pending'
}

/**
 * @interface
 */
export interface Expense {
  id: string;
  date: string;
  category: string; // 'Feed' | 'Drugs' | 'Salaries' | 'Maintenance' | 'Utilities'
  amount: number;
  description: string;
}

/**
 * @interface
 */
export interface CushionAudit {
  id: string;
  date: string;
  boxName: string;
  status: string;
  actionTaken: string;
}

/**
 * @interface
 */
export interface MaturationLog {
  id: string;
  date: string;
  birdId: string;
  breed: string;
  eggsCount: number;
  avgWeightGrams: number;
  notes: string;
}

/**
 * @interface
 */
export interface ProcurePipeline {
  id: string;
  date: string;
  milestone: string;
  supplier: string;
  status: string;
  eta: string;
}

/**
 * @interface
 */
export interface CctvLog {
  id: string;
  date: string;
  device: string;
  event: string;
  status: string;
}

/**
 * @interface
 */
export interface Invoice {
  id: string;
  date: string;
  saleId: string;
  customerName: string;
  items: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string; // 'Paid' | 'Pending' | 'Overdue'
}

/**
 * @interface
 */
export interface StaffTask {
  id: string;
  assignedTo: string;
  taskName: string;
  status: string; // 'Pending' | 'Completed'
  date: string;
}

/**
 * @interface
 */
export interface AlertSettings {
  feedThresholdKg: number;
  eggDropPercentage: number;
  notifySms: boolean;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
}

/**
 * @interface
 */
export interface AlertLog {
  id: string;
  date: string;
  message: string;
  severity: string; // 'Critical' | 'Warning' | 'Info'
  read?: boolean | null;
}

/**
 * @interface
 */
export interface MortalityLog {
  id: string;
  date: string;
  batchId: string;
  count: number;
  cause: string;
}

/**
 * @interface
 */
export interface MedicationTemplateStage {
  dayOffset: number;
  medicationName: string;
  type: 'Vaccine' | 'Medication' | 'Supplement';
}

/**
 * @interface
 */
export interface MedicationTemplate {
  id: string;
  name: string;
  targetType: string; // 'Layers' | 'Broilers' | 'Chicks'
  stages: unknown; // MedicationTemplateStage[]
}

/**
 * @interface
 */
export interface MedicationSchedule {
  id: string;
  batchId: string;
  medicationName: string;
  type: string; // 'Vaccine' | 'Medication' | 'Supplement'
  scheduledDate: string;
  status: string; // 'Pending' | 'Completed'
}

/**
 * @interface
 */
export interface PayrollLog {
  id: string;
  date: string;
  staffId: string;
  amount: number;
  period: string;
}

/**
 * @interface
 */
export interface EquipmentInventory {
  id: string;
  name: string;
  type: string; // 'Feeder' | 'Drinker' | 'Heater' | 'Cage' | 'Generator' | 'Other'
  quantity: number;
  status: string; // 'Good' | 'Needs Repair' | 'Broken'
  lastMaintenance: string;
}

/**
 * @interface
 */
export interface ContactRecord {
  id: string;
  name: string;
  type: string; // 'Customer' | 'Supplier'
  contactDetails: string;
  totalTransactions: number;
  notes: string;
}

/**
 * @interface
 */
export interface FarmPen {
  id: string;
  name: string;
  capacity: number;
  currentBatchId: string | null;
  status: string; // 'Active' | 'Cleaning' | 'Empty'
  temperatureLogs: unknown; // { date: string; tempCelsius: number }[]
}

/**
 * @interface
 */
export interface Workspace {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

/**
 * @interface
 */
export interface DatabaseSchema {
  batches: ChickenBatch[];
  eggs: EggRecord[];
  feeds: FeedInventory[];
  feedLogs: DailyFeedLog[];
  staff: Staff[];
  sales: Sale[];
  expenses: Expense[];
  cushionAudits: CushionAudit[];
  maturationLogs: MaturationLog[];
  procurePipeline: ProcurePipeline[];
  cctvLogs: CctvLog[];
  invoices: Invoice[];
  tasks: StaffTask[];
  alertSettings: AlertSettings;
  alertLogs: AlertLog[];
  mortalityLogs: MortalityLog[];
  medicationTemplates: MedicationTemplate[];
  medicationSchedules: MedicationSchedule[];
  payrollLogs: PayrollLog[];
  equipment: EquipmentInventory[];
  contacts: ContactRecord[];
  farmPens: FarmPen[];
  workspaces: Workspace[];
}
