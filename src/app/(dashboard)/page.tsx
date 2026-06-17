'use strict';
import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { DashboardClient } from "@/components/features/dashboard/DashboardClient";
import type {
  DatabaseSchema,
  ChickenBatch,
  EggRecord,
  FeedInventory,
  DailyFeedLog,
  Staff,
  Sale,
  Expense,
  CushionAudit,
  MaturationLog,
  ProcurePipeline,
  CctvLog,
  Invoice,
  StaffTask,
  AlertSettings,
  AlertLog,
  MortalityLog,
  MedicationTemplate,
  MedicationSchedule,
  PayrollLog,
  EquipmentInventory,
  ContactRecord,
  FarmPen,
} from "@/data/types";

/** Exported function default */
export default async function Home() {
  const batches = (await db.select().from(schema.batches)) as ChickenBatch[];
  const eggs = (await db.select().from(schema.eggs)) as EggRecord[];
  const feeds = (await db.select().from(schema.feeds)) as FeedInventory[];
  const feedLogs = (await db.select().from(schema.feedLogs)) as DailyFeedLog[];
  const staff = (await db.select().from(schema.staff)) as Staff[];
  const sales = (await db.select().from(schema.sales)) as Sale[];
  const expenses = (await db.select().from(schema.expenses)) as Expense[];
  const cushionAudits = (await db.select().from(schema.cushionAudits)) as CushionAudit[];
  const maturationLogs = (await db.select().from(schema.maturationLogs)) as MaturationLog[];
  const procurePipeline = (await db.select().from(schema.procurePipeline)) as ProcurePipeline[];
  const cctvLogs = (await db.select().from(schema.cctvLogs)) as CctvLog[];
  const invoices = (await db.select().from(schema.invoices)) as Invoice[];
  const tasks = (await db.select().from(schema.tasks)) as StaffTask[];
  const alertSettings = (await db.select().from(schema.alertSettings).limit(1))[0] as AlertSettings | undefined;
  const alertSettingsData: AlertSettings = alertSettings ?? {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true,
  };
  const alertLogs = (await db.select().from(schema.alertLogs)) as AlertLog[];
  const mortalityLogs = (await db.select().from(schema.mortalityLogs)) as MortalityLog[];
  const medicationTemplates = (await db.select().from(schema.medicationTemplates)) as MedicationTemplate[];
  const medicationSchedules = (await db.select().from(schema.medicationSchedules)) as MedicationSchedule[];
  const payrollLogs = (await db.select().from(schema.payrollLogs)) as PayrollLog[];
  const equipment = (await db.select().from(schema.equipment)) as EquipmentInventory[];
  const contacts = (await db.select().from(schema.contacts)) as ContactRecord[];
  const farmPens = (await db.select().from(schema.farmPens)) as FarmPen[];

  return (
    <DashboardClient
      initialData={{
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
        alertSettings: alertSettingsData,
        alertLogs,
        mortalityLogs,
        medicationTemplates,
        medicationSchedules,
        payrollLogs,
        equipment,
        contacts,
        farmPens,
      } as DatabaseSchema}
    />
  );
}
