'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter, applyStaffWorkspaceFilter } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [
    batches, eggs, feeds, feedLogs, staff, sales, expenses, cushionAudits, maturationLogs,
    procurePipeline, cctvLogs, invoices, tasks, alertSettingsRecords, alertLogs, mortalityLogs,
    medicationTemplates, medicationSchedules, payrollLogs, equipment, contacts, farmPens
  ] = await Promise.all([
    applyWorkspaceFilter(supabase.from('batches').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('eggs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('feeds').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('feedLogs').select('*'), workspaceId),
    applyStaffWorkspaceFilter(supabase.from('staff').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('sales').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('expenses').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('cushionAudits').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('maturationLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('procurePipeline').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('cctvLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('invoices').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('tasks').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('alertSettings').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('alertLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('mortalityLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('medicationTemplates').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('medicationSchedules').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('payrollLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('equipment').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('contacts').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('farmPens').select('*'), workspaceId)
  ]);

  const alertSettings = alertSettingsRecords.data?.[0] || {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true
  };

  const normalizedBatches = (batches.data || []).map((b: any) => ({
    ...b,
    quantity: Number(b.quantity) || 0,
    mortalityCount: Number(b.mortalityCount) || 0,
    unitPurchasePrice: Number(b.unitPurchasePrice) || 0,
    projectedSellingPrice: Number(b.projectedSellingPrice) || 0
  }));

  const normalizedEggs = (eggs.data || []).map((e: any) => ({
    ...e,
    goodEggs: Number(e.goodEggs) || 0,
    brokenEggs: Number(e.brokenEggs) || 0,
    spoiltEggs: Number(e.spoiltEggs) || 0
  }));

  const normalizedFeeds = (feeds.data || []).map((f: any) => ({
    ...f,
    quantityKg: Number(f.quantityKg) || 0,
    costPerBag: Number(f.costPerBag) || 0
  }));

  const normalizedStaff = (staff.data || []).map((s: any) => ({
    ...s,
    salary: Number(s.salary) || 0,
    attendanceDays: Number(s.attendanceDays) || 0
  }));

  const normalizedSales = (sales.data || []).map((s: any) => ({
    ...s,
    quantity: Number(s.quantity) || 0,
    totalAmount: Number(s.totalAmount) || 0
  }));

  const normalizedExpenses = (expenses.data || []).map((e: any) => ({
    ...e,
    amount: Number(e.amount) || 0
  }));

  const normalizedMortality = (mortalityLogs.data || []).map((m: any) => ({
    ...m,
    count: Number(m.count) || 0
  }));

  return NextResponse.json({
    batches: normalizedBatches, 
    eggs: normalizedEggs, 
    feeds: normalizedFeeds, 
    feedLogs: feedLogs.data || [], 
    staff: normalizedStaff, 
    sales: normalizedSales, 
    expenses: normalizedExpenses,
    cushionAudits: cushionAudits.data || [], 
    maturationLogs: maturationLogs.data || [], 
    procurePipeline: procurePipeline.data || [], 
    cctvLogs: cctvLogs.data || [],
    invoices: invoices.data || [], 
    tasks: tasks.data || [], 
    alertSettings, 
    alertLogs: alertLogs.data || [], 
    mortalityLogs: normalizedMortality,
    medicationTemplates: medicationTemplates.data || [], 
    medicationSchedules: medicationSchedules.data || [], 
    payrollLogs: payrollLogs.data || [],
    equipment: equipment.data || [], 
    contacts: contacts.data || [], 
    farmPens: farmPens.data || []
  });
}

