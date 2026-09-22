'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

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
    applyWorkspaceFilter(supabase.from('staff').select('*'), workspaceId),
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

  return NextResponse.json({
    batches: batches.data || [], 
    eggs: eggs.data || [], 
    feeds: feeds.data || [], 
    feedLogs: feedLogs.data || [], 
    staff: staff.data || [], 
    sales: sales.data || [], 
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
