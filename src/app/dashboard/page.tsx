'use strict';
import { supabase } from "@/lib/supabase";
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
    batchesRaw, eggsRaw, feedsRaw, feedLogsRaw, staffRaw, salesRaw, expensesRaw, cushionAuditsRaw, maturationLogsRaw,
    procurePipelineRaw, cctvLogsRaw, invoicesRaw, tasksRaw, alertSettingsRaw, alertLogsRaw, mortalityLogsRaw,
    medicationTemplatesRaw, medicationSchedulesRaw, payrollLogsRaw, equipmentRaw, contactsRaw, farmPensRaw
  ] = await Promise.all([
    supabase.from('batches').select('*').range(offset, offset + 49),
    supabase.from('eggs').select('*').range(offset, offset + 49),
    supabase.from('feeds').select('*').range(offset, offset + 49),
    supabase.from('feedLogs').select('*').range(offset, offset + 49),
    supabase.from('staff').select('*').range(offset, offset + 49),
    supabase.from('sales').select('*').range(offset, offset + 49),
    supabase.from('expenses').select('*').range(offset, offset + 49),
    supabase.from('cushionAudits').select('*').range(offset, offset + 49),
    supabase.from('maturationLogs').select('*').range(offset, offset + 49),
    supabase.from('procurePipeline').select('*').range(offset, offset + 49),
    supabase.from('cctvLogs').select('*').range(offset, offset + 49),
    supabase.from('invoices').select('*').range(offset, offset + 49),
    supabase.from('tasks').select('*').range(offset, offset + 49),
    supabase.from('alertSettings').select('*').limit(1),
    supabase.from('alertLogs').select('*').range(offset, offset + 49),
    supabase.from('mortalityLogs').select('*').range(offset, offset + 49),
    supabase.from('medicationTemplates').select('*').range(offset, offset + 49),
    supabase.from('medicationSchedules').select('*').range(offset, offset + 49),
    supabase.from('payrollLogs').select('*').range(offset, offset + 49),
    supabase.from('equipment').select('*').range(offset, offset + 49),
    supabase.from('contacts').select('*').range(offset, offset + 49),
    supabase.from('farmPens').select('*').range(offset, offset + 49)
  ]);

  const batches = batchesRaw.data || [];
  const eggs = eggsRaw.data || [];
  const feeds = feedsRaw.data || [];
  const feedLogs = feedLogsRaw.data || [];
  const staff = staffRaw.data || [];
  const sales = salesRaw.data || [];
  const expenses = expensesRaw.data || [];
  const cushionAudits = cushionAuditsRaw.data || [];
  const maturationLogs = maturationLogsRaw.data || [];
  const procurePipeline = procurePipelineRaw.data || [];
  const cctvLogs = cctvLogsRaw.data || [];
  const invoices = invoicesRaw.data || [];
  const tasks = tasksRaw.data || [];
  const alertLogs = alertLogsRaw.data || [];
  const mortalityLogs = mortalityLogsRaw.data || [];
  const medicationTemplates = medicationTemplatesRaw.data || [];
  const medicationSchedules = medicationSchedulesRaw.data || [];
  const payrollLogs = payrollLogsRaw.data || [];
  const equipment = equipmentRaw.data || [];
  const contacts = contactsRaw.data || [];
  const farmPens = farmPensRaw.data || [];

  const alertSettings = (alertSettingsRaw.data || [])[0] as AlertSettings | undefined;
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
