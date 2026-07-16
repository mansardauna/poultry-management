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
export default async function Home(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt((searchParams?.page as string) || '1');
  const offset = (page - 1) * 50;

  const [
    batches, eggs, feeds, feedLogs, staff, sales, expenses, cushionAudits, maturationLogs,
    procurePipeline, cctvLogs, invoices, tasks, alertSettingsRaw, alertLogs, mortalityLogs,
    medicationTemplates, medicationSchedules, payrollLogs, equipment, contacts, farmPens
  ] = await Promise.all([
    db.select().from(schema.batches).limit(50).offset(offset),
    db.select().from(schema.eggs).limit(50).offset(offset),
    db.select().from(schema.feeds).limit(50).offset(offset),
    db.select().from(schema.feedLogs).limit(50).offset(offset),
    db.select().from(schema.staff).limit(50).offset(offset),
    db.select().from(schema.sales).limit(50).offset(offset),
    db.select().from(schema.expenses).limit(50).offset(offset),
    db.select().from(schema.cushionAudits).limit(50).offset(offset),
    db.select().from(schema.maturationLogs).limit(50).offset(offset),
    db.select().from(schema.procurePipeline).limit(50).offset(offset),
    db.select().from(schema.cctvLogs).limit(50).offset(offset),
    db.select().from(schema.invoices).limit(50).offset(offset),
    db.select().from(schema.tasks).limit(50).offset(offset),
    db.select().from(schema.alertSettings).limit(1),
    db.select().from(schema.alertLogs).limit(50).offset(offset),
    db.select().from(schema.mortalityLogs).limit(50).offset(offset),
    db.select().from(schema.medicationTemplates).limit(50).offset(offset),
    db.select().from(schema.medicationSchedules).limit(50).offset(offset),
    db.select().from(schema.payrollLogs).limit(50).offset(offset),
    db.select().from(schema.equipment).limit(50).offset(offset),
    db.select().from(schema.contacts).limit(50).offset(offset),
    db.select().from(schema.farmPens).limit(50).offset(offset)
  ]);

  const alertSettings = alertSettingsRaw[0] as AlertSettings | undefined;
  const alertSettingsData: AlertSettings = alertSettings ?? {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true,
  };

  return (
    <DashboardClient
      initialData={{
        batches: batches as ChickenBatch[],
        eggs: eggs as EggRecord[],
        feeds: feeds as FeedInventory[],
        feedLogs: feedLogs as DailyFeedLog[],
        staff: staff as Staff[],
        sales: sales as Sale[],
        expenses: expenses as Expense[],
        cushionAudits: cushionAudits as CushionAudit[],
        maturationLogs: maturationLogs as MaturationLog[],
        procurePipeline: procurePipeline as ProcurePipeline[],
        cctvLogs: cctvLogs as CctvLog[],
        invoices: invoices as Invoice[],
        tasks: tasks as StaffTask[],
        alertSettings: alertSettingsData,
        alertLogs: alertLogs as AlertLog[],
        mortalityLogs: mortalityLogs as MortalityLog[],
        medicationTemplates: medicationTemplates as MedicationTemplate[],
        medicationSchedules: medicationSchedules as MedicationSchedule[],
        payrollLogs: payrollLogs as PayrollLog[],
        equipment: equipment as EquipmentInventory[],
        contacts: contacts as ContactRecord[],
        farmPens: farmPens as FarmPen[],
      } as DatabaseSchema}
    />
  );
}
