'use strict';
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId, applyWorkspaceFilter } from "@/lib/workspace";
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
  const user = await getAuthUser();
  if (user?.email === 'superadmin@pfms.com' || user?.role === 'SuperAdmin') {
    redirect('/dashboard/admin');
  }

  const workspaceId = await getWorkspaceId();
  const searchParams = await props.searchParams;
  const page = parseInt((searchParams?.page as string) || '1');
  const offset = (page - 1) * 50;

  const [
    batchesRaw, eggsRaw, feedsRaw, feedLogsRaw, staffRaw, salesRaw, expensesRaw, cushionAuditsRaw, maturationLogsRaw,
    procurePipelineRaw, cctvLogsRaw, invoicesRaw, tasksRaw, alertSettingsRaw, alertLogsRaw, mortalityLogsRaw,
    medicationTemplatesRaw, medicationSchedulesRaw, payrollLogsRaw, equipmentRaw, contactsRaw, farmPensRaw
  ] = await Promise.all([
    applyWorkspaceFilter(supabase.from('batches').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('eggs').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('feeds').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('feedLogs').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('staff').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('sales').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('expenses').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('cushionAudits').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('maturationLogs').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('procurePipeline').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('cctvLogs').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('invoices').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('tasks').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('alertSettings').select('*'), workspaceId).limit(1),
    applyWorkspaceFilter(supabase.from('alertLogs').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('mortalityLogs').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('medicationTemplates').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('medicationSchedules').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('payrollLogs').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('equipment').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('contacts').select('*'), workspaceId).range(offset, offset + 49),
    applyWorkspaceFilter(supabase.from('farmPens').select('*'), workspaceId).range(offset, offset + 49)
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
      userRole={user?.role || 'Admin'}
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
