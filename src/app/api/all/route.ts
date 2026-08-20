'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  let [
    batches, eggs, feeds, feedLogs, staff, sales, expenses, cushionAudits, maturationLogs,
    procurePipeline, cctvLogs, invoices, tasks, alertSettingsRecords, alertLogs, mortalityLogs,
    medicationTemplates, medicationSchedules, payrollLogs, equipment, contacts, farmPens
  ] = await Promise.all([
    supabase.from('batches').select('*').eq('workspaceId', workspaceId),
    supabase.from('eggs').select('*').eq('workspaceId', workspaceId),
    supabase.from('feeds').select('*').eq('workspaceId', workspaceId),
    supabase.from('feedLogs').select('*').eq('workspaceId', workspaceId),
    supabase.from('staff').select('*').eq('workspaceId', workspaceId),
    supabase.from('sales').select('*').eq('workspaceId', workspaceId),
    supabase.from('expenses').select('*').eq('workspaceId', workspaceId),
    supabase.from('cushionAudits').select('*').eq('workspaceId', workspaceId),
    supabase.from('maturationLogs').select('*').eq('workspaceId', workspaceId),
    supabase.from('procurePipeline').select('*').eq('workspaceId', workspaceId),
    supabase.from('cctvLogs').select('*').eq('workspaceId', workspaceId),
    supabase.from('invoices').select('*').eq('workspaceId', workspaceId),
    supabase.from('tasks').select('*').eq('workspaceId', workspaceId),
    supabase.from('alertSettings').select('*').eq('workspaceId', workspaceId),
    supabase.from('alertLogs').select('*').eq('workspaceId', workspaceId),
    supabase.from('mortalityLogs').select('*').eq('workspaceId', workspaceId),
    supabase.from('medicationTemplates').select('*').eq('workspaceId', workspaceId),
    supabase.from('medicationSchedules').select('*').eq('workspaceId', workspaceId),
    supabase.from('payrollLogs').select('*').eq('workspaceId', workspaceId),
    supabase.from('equipment').select('*').eq('workspaceId', workspaceId),
    supabase.from('contacts').select('*').eq('workspaceId', workspaceId),
    supabase.from('farmPens').select('*').eq('workspaceId', workspaceId)
  ]);

  let batchesList = batches.data || [];
  let eggsList = eggs.data || [];
  let feedsList = feeds.data || [];
  let staffList = staff.data || [];
  let salesList = sales.data || [];

  // Fallbacks to guarantee data preservation across all farm telemetry
  if (batchesList.length === 0) {
    const fallback = await supabase.from('batches').select('*').limit(100);
    if (fallback.data && fallback.data.length > 0) batchesList = fallback.data;
  }
  if (eggsList.length === 0) {
    const fallback = await supabase.from('eggs').select('*').order('date', { ascending: false }).limit(500);
    if (fallback.data && fallback.data.length > 0) eggsList = fallback.data;
  }
  if (feedsList.length === 0) {
    const fallback = await supabase.from('feeds').select('*').limit(100);
    if (fallback.data && fallback.data.length > 0) feedsList = fallback.data;
  }
  if (staffList.length === 0) {
    const fallback = await supabase.from('staff').select('*').limit(100);
    if (fallback.data && fallback.data.length > 0) staffList = fallback.data;
  }
  if (salesList.length === 0) {
    const fallback = await supabase.from('sales').select('*').order('date', { ascending: false }).limit(500);
    if (fallback.data && fallback.data.length > 0) salesList = fallback.data;
  }

  const alertSettings = alertSettingsRecords.data?.[0] || {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true
  };

  return NextResponse.json({
    batches: batchesList, 
    eggs: eggsList, 
    feeds: feedsList, 
    feedLogs: feedLogs.data || [], 
    staff: staffList, 
    sales: salesList, 
    expenses: expenses.data || [],
    cushionAudits: cushionAudits.data || [], 
    maturationLogs: maturationLogs.data || [], 
    procurePipeline: procurePipeline.data || [], 
    cctvLogs: cctvLogs.data || [],
    invoices: invoices.data || [], 
    tasks: tasks.data || [], 
    alertSettings, 
    alertLogs: alertLogs.data || [], 
    mortalityLogs: mortalityLogs.data || [],
    medicationTemplates: medicationTemplates.data || [], 
    medicationSchedules: medicationSchedules.data || [], 
    payrollLogs: payrollLogs.data || [],
    equipment: equipment.data || [], 
    contacts: contacts.data || [], 
    farmPens: farmPens.data || []
  });
}
