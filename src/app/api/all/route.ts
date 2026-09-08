'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [
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
