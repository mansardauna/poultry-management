import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getWorkspaceId, applyWorkspaceFilter } from "@/lib/workspace";
import { getFeatureSwitchesForTier } from "@/lib/featureSwitches";
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
  const headersList = await headers().catch(() => null);
  const cookieStore = await cookies();
  const headerRole = headersList?.get('x-user-role');
  const cookieRole = cookieStore.get('pfms_role')?.value;
  const user = await getAuthUser();

  const isImpersonating = cookieStore.get('pfms_impersonate_by')?.value === 'superadmin';

  const isSuperAdminUser = !isImpersonating && (
    headerRole === 'SuperAdmin' ||
    cookieRole === 'SuperAdmin' ||
    user?.role === 'SuperAdmin'
  );

  if (isSuperAdminUser) {
    redirect('/dashboard/admin');
  }

  const tier = cookieStore.get('pfms_tier')?.value || headersList?.get('x-user-tier') || 'free';
  const featureSwitches = await getFeatureSwitchesForTier(tier);

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

  const batches = (batchesRaw.data || []).map((b: any) => ({
    ...b,
    quantity: Number(b.quantity) || 0,
    mortalityCount: Number(b.mortalityCount) || 0,
    unitPurchasePrice: Number(b.unitPurchasePrice) || 0,
    projectedSellingPrice: Number(b.projectedSellingPrice) || 0
  })) as ChickenBatch[];

  const eggs = (eggsRaw.data || []).map((e: any) => ({
    ...e,
    goodEggs: Number(e.goodEggs) || 0,
    brokenEggs: Number(e.brokenEggs) || 0,
    spoiltEggs: Number(e.spoiltEggs) || 0
  })) as EggRecord[];

  const feeds = (feedsRaw.data || []).map((f: any) => ({
    ...f,
    quantityKg: Number(f.quantityKg) || 0,
    costPerBag: Number(f.costPerBag) || 0
  })) as FeedInventory[];

  const feedLogs = feedLogsRaw.data || [];

  const staff = (staffRaw.data || []).map((s: any) => ({
    ...s,
    salary: Number(s.salary) || 0,
    attendanceDays: Number(s.attendanceDays) || 0
  })) as Staff[];

  const sales = (salesRaw.data || []).map((s: any) => ({
    ...s,
    quantity: Number(s.quantity) || 0,
    totalAmount: Number(s.totalAmount) || 0
  })) as Sale[];

  const expenses = (expensesRaw.data || []).map((e: any) => ({
    ...e,
    amount: Number(e.amount) || 0
  })) as Expense[];

  const cushionAudits = cushionAuditsRaw.data || [];
  const maturationLogs = maturationLogsRaw.data || [];
  const procurePipeline = procurePipelineRaw.data || [];
  const cctvLogs = cctvLogsRaw.data || [];
  const invoices = invoicesRaw.data || [];
  const tasks = tasksRaw.data || [];
  const alertLogs = alertLogsRaw.data || [];

  const mortalityLogs = (mortalityLogsRaw.data || []).map((m: any) => ({
    ...m,
    count: Number(m.count) || 0
  })) as MortalityLog[];

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

  const effectiveRole = isImpersonating ? (cookieRole || 'Admin') : (user?.role || cookieRole || 'Admin');

  return (
    <DashboardClient
      userRole={effectiveRole}
      chartsEnabled={featureSwitches.chartsEnabled}
      initialData={{
        batches,
        eggs,
        feeds,
        feedLogs: feedLogs as DailyFeedLog[],
        staff,
        sales,
        expenses,
        cushionAudits: cushionAudits as CushionAudit[],
        maturationLogs: maturationLogs as MaturationLog[],
        procurePipeline: procurePipeline as ProcurePipeline[],
        cctvLogs: cctvLogs as CctvLog[],
        invoices: invoices as Invoice[],
        tasks: tasks as StaffTask[],
        alertSettings: alertSettingsData,
        alertLogs: alertLogs as AlertLog[],
        mortalityLogs,
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
