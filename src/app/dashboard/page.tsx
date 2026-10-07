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
export default async function Home(_props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
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
  const rawResults = (await Promise.all([
    applyWorkspaceFilter(supabase.from('batches').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('eggs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('feeds').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('feedLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('staff').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('sales').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('expenses').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('cushionAudits').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('maturationLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('procurePipeline').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('cctvLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('invoices').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('tasks').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('alertSettings').select('*'), workspaceId).limit(1),
    applyWorkspaceFilter(supabase.from('alertLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('mortalityLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('medicationTemplates').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('medicationSchedules').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('payrollLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('equipment').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('contacts').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('farmPens').select('*'), workspaceId)
  ])) as unknown as Array<{ data: Record<string, unknown>[] | null }>;

  const [
    batchesRaw, eggsRaw, feedsRaw, feedLogsRaw, staffRaw, salesRaw, expensesRaw, cushionAuditsRaw, maturationLogsRaw,
    procurePipelineRaw, cctvLogsRaw, invoicesRaw, tasksRaw, alertSettingsRaw, alertLogsRaw, mortalityLogsRaw,
    medicationTemplatesRaw, medicationSchedulesRaw, payrollLogsRaw, equipmentRaw, contactsRaw, farmPensRaw
  ] = rawResults;

  const batches = (batchesRaw.data || []).map((b: Record<string, unknown>) => ({
    ...b,
    quantity: Number(b.quantity) || 0,
    mortalityCount: Number(b.mortalityCount) || 0,
    unitPurchasePrice: Number(b.unitPurchasePrice) || 0,
    projectedSellingPrice: Number(b.projectedSellingPrice) || 0
  })) as unknown as ChickenBatch[];

  const eggs = (eggsRaw.data || []).map((e: Record<string, unknown>) => ({
    ...e,
    goodEggs: Number(e.goodEggs) || 0,
    brokenEggs: Number(e.brokenEggs) || 0,
    spoiltEggs: Number(e.spoiltEggs) || 0
  })) as unknown as EggRecord[];

  const feeds = (feedsRaw.data || []).map((f: Record<string, unknown>) => ({
    ...f,
    quantityKg: Number(f.quantityKg) || 0,
    costPerBag: Number(f.costPerBag) || 0
  })) as unknown as FeedInventory[];

  const feedLogs = feedLogsRaw.data || [];

  const staff = (staffRaw.data || []).map((s: Record<string, unknown>) => ({
    ...s,
    salary: Number(s.salary) || 0,
    attendanceDays: Number(s.attendanceDays) || 0
  })) as unknown as Staff[];

  const sales = (salesRaw.data || []).map((s: Record<string, unknown>) => ({
    ...s,
    quantity: Number(s.quantity) || 0,
    totalAmount: Number(s.totalAmount) || 0
  })) as unknown as Sale[];

  const expenses = (expensesRaw.data || []).map((e: Record<string, unknown>) => ({
    ...e,
    amount: Number(e.amount) || 0
  })) as unknown as Expense[];

  const cushionAudits = cushionAuditsRaw.data || [];
  const maturationLogs = maturationLogsRaw.data || [];
  const procurePipeline = procurePipelineRaw.data || [];
  const cctvLogs = cctvLogsRaw.data || [];
  const invoices = invoicesRaw.data || [];
  const tasks = tasksRaw.data || [];
  const alertLogs = alertLogsRaw.data || [];

  const mortalityLogs = (mortalityLogsRaw.data || []).map((m: Record<string, unknown>) => ({
    ...m,
    count: Number(m.count) || 0
  })) as unknown as MortalityLog[];

  const medicationTemplates = medicationTemplatesRaw.data || [];
  const medicationSchedules = medicationSchedulesRaw.data || [];
  const payrollLogs = payrollLogsRaw.data || [];
  const equipment = equipmentRaw.data || [];
  const contacts = contactsRaw.data || [];
  const farmPens = farmPensRaw.data || [];

  const alertSettings = (alertSettingsRaw.data || [])[0] as unknown as AlertSettings | undefined;
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
        feedLogs: feedLogs as unknown as DailyFeedLog[],
        staff,
        sales,
        expenses,
        cushionAudits: cushionAudits as unknown as CushionAudit[],
        maturationLogs: maturationLogs as unknown as MaturationLog[],
        procurePipeline: procurePipeline as unknown as ProcurePipeline[],
        cctvLogs: cctvLogs as unknown as CctvLog[],
        invoices: invoices as unknown as Invoice[],
        tasks: tasks as unknown as StaffTask[],
        alertSettings: alertSettingsData,
        alertLogs: alertLogs as unknown as AlertLog[],
        mortalityLogs,
        medicationTemplates: medicationTemplates as unknown as MedicationTemplate[],
        medicationSchedules: medicationSchedules as unknown as MedicationSchedule[],
        payrollLogs: payrollLogs as unknown as PayrollLog[],
        equipment: equipment as unknown as EquipmentInventory[],
        contacts: contacts as unknown as ContactRecord[],
        farmPens: farmPens as unknown as FarmPen[],
      } as DatabaseSchema}
    />
  );
}
